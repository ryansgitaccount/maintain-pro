import React, { useState } from 'react';
import { Machine } from '@/api/entities';
import { parseCSV } from '@/utils/csvParser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function CSVImportDialog({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    setError(null);
    setProgress(0);

    try {
      // Read the file
      const text = await file.text();
      setProgress(25);

      // Parse the CSV
      const machines = parseCSV(text);
      if (machines.length === 0) {
        setError('CSV file is empty or has no valid records');
        setIsImporting(false);
        return;
      }

      setProgress(50);

      // Batch import the machines
      const importResults = await Machine.batchImport(machines);
      setProgress(75);

      if (importResults.failed.length > 0 && importResults.success.length === 0) {
        setError(`All records failed to import: ${importResults.failed[0].error}`);
      } else {
        setResults(importResults);
        setProgress(100);
      }
    } catch (err) {
      setError(err.message || 'Failed to import CSV file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (results && results.success.length > 0) {
      onSuccess();
    }
    setFile(null);
    setProgress(0);
    setResults(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Machines from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!results ? (
            <>
              {/* File Input */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isImporting}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block">
                  <FileUp className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-900">
                    {file ? file.name : 'Click to select CSV file'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    or drag and drop
                  </p>
                </label>
              </div>

              {/* Expected CSV Format */}
              <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Expected CSV format:</p>
                <p>plant_id, model, year, manufacturer, serial_number, status, crew_name, attachment</p>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Importing records...</p>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-3">
                {results.success.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900">
                        {results.success.length} records imported successfully
                      </p>
                    </div>
                  </div>
                )}

                {results.failed.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">
                        {results.failed.length} records failed
                      </p>
                      <div className="text-xs text-red-700 mt-2 max-h-32 overflow-y-auto space-y-1">
                        {results.failed.slice(0, 3).map((item, idx) => (
                          <p key={idx}>
                            Row {item.index + 2}: {item.error}
                          </p>
                        ))}
                        {results.failed.length > 3 && (
                          <p className="text-red-600">
                            +{results.failed.length - 3} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-slate-600 pt-2">
                  <p>Total: {results.total} records</p>
                  <p>Success: {results.success.length}</p>
                  <p>Failed: {results.failed.length}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {!results ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || isImporting}
                className="bg-slate-800 hover:bg-slate-700"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="bg-slate-800 hover:bg-slate-700"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
