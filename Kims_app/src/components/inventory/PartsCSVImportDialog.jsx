import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileUp, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { WorkshopInventory } from '@/api/entities';

export default function PartsCSVImportDialog({ onImportComplete }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
      setErrors([]);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Map CSV headers to database columns
    const headerMap = {
      'Machine / Model': 'machine_model',
      'Machine/Model': 'machine_model',
      'Unique ID': 'unique_id',
      'NBL Code': 'nbl_code',
      'Serial No.': 'serial_number',
      'Serial No': 'serial_number',
      'Part Description': 'part_description',
      'Qty': 'quantity_on_hand',
      'Quantity': 'quantity_on_hand',
      'Service Interval': 'service_interval',
      'Part No (OEM)': 'part_number_oem',
      'Part No OEM': 'part_number_oem',
      'OEM Part Number': 'part_number_oem',
      'Alt / After Market': 'part_number_aftermarket',
      'Aftermarket': 'part_number_aftermarket',
      'Notes / Capacities': 'notes',
      'Notes': 'notes',
    };

    const mappedHeaders = headers.map(h => headerMap[h] || h.toLowerCase().replace(/\s+/g, '_'));

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row = {};
      mappedHeaders.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index].trim();
        }
      });

      // Only add rows that have at least a part description
      if (row.part_description) {
        rows.push(row);
      }
    }

    return rows;
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setErrors([]);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);

      if (parsedData.length === 0) {
        setErrors(['No valid data found in CSV file']);
        setImporting(false);
        return;
      }

      // Import in batches of 100
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < parsedData.length; i += batchSize) {
        batches.push(parsedData.slice(i, i + batchSize));
      }

      let successCount = 0;
      let errorCount = 0;
      const importErrors = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          // Use Supabase batch insert
          const { data, error } = await WorkshopInventory.batchCreate(batch);
          
          if (error) {
            errorCount += batch.length;
            importErrors.push(`Batch ${i + 1}: ${error.message}`);
          } else {
            successCount += batch.length;
          }
        } catch (err) {
          errorCount += batch.length;
          importErrors.push(`Batch ${i + 1}: ${err.message}`);
        }

        setProgress(((i + 1) / batches.length) * 100);
      }

      setResult({
        total: parsedData.length,
        success: successCount,
        failed: errorCount,
      });

      if (importErrors.length > 0) {
        setErrors(importErrors);
      }

      if (successCount > 0) {
        onImportComplete?.();
      }
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setErrors([]);
    setProgress(0);
  };

  const downloadTemplate = () => {
    const template = [
      ['Machine / Model', 'Unique ID', 'NBL Code', 'Serial No.', 'Part Description', 'Qty', 'Service Interval', 'Part No (OEM)', 'Alt / After Market', 'Notes / Capacities'],
      ['Caterpillar 336DL', '336-1', '9210', '#123', 'Engine Oil Filter', '2', '250/500', 'CAT-12345', 'FLT-98765', 'Use Fleetguard'],
      ['Komatsu PC300', 'PC-01', '9215', 'X456', 'Hydraulic Filter', '1', '1000', 'KOM-54321', 'HYD-11111', ''],
    ];

    const csvContent = template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parts-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Parts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with parts inventory data. The file should include columns for machine model, 
            part description, service intervals, and part numbers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result && (
            <>
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                />
              </div>

              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  <Button variant="link" className="p-0 h-auto" onClick={downloadTemplate}>
                    Download CSV template
                  </Button>
                  {' '}to see the expected format.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-semibold">Expected columns:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
                  <li>Machine / Model</li>
                  <li>Unique ID (Fleet ID)</li>
                  <li>NBL Code</li>
                  <li>Serial No.</li>
                  <li>Part Description</li>
                  <li>Qty</li>
                  <li>Service Interval</li>
                  <li>Part No (OEM)</li>
                  <li>Alt / After Market</li>
                  <li>Notes / Capacities</li>
                </ul>
              </div>
            </>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Importing parts...</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <Alert className={result.failed > 0 ? 'border-amber-500' : 'border-green-500'}>
              {result.failed > 0 ? (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">
                  Import {result.failed > 0 ? 'completed with errors' : 'successful'}
                </div>
                <div className="text-sm space-y-1">
                  <p>Total rows: {result.total}</p>
                  <p className="text-green-600">Successfully imported: {result.success}</p>
                  {result.failed > 0 && (
                    <p className="text-amber-600">Failed: {result.failed}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Errors occurred:</div>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={importing}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? (
                  <>Importing...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
