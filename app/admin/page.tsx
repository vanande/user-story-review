// File: app/admin/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { DataTable } from "@/components/ui/data-table";
import { columns, type Review } from "./columns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Download, CheckCircle } from "lucide-react"; // Import CheckCircle icon
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Dataset {
  id: number;
  name: string;
  filename: string;
  is_active: number; // SQLite 0 or 1
}

export default function AdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);
  const [datasetsError, setDatasetsError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // --- State for Activation ---
  const [isActivating, setIsActivating] = useState(false);
  // --- End State for Activation ---

  // --- Fetch Datasets (memoized with useCallback) ---
  const fetchDatasets = useCallback(async (selectNewId?: string | null) => {
    setIsDatasetsLoading(true);
    setDatasetsError(null);
    // Don't reset selection immediately if we intend to re-select
    // setSelectedDatasetId(null);
    try {
      const response = await fetch('/api/admin/datasets');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch datasets: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
      }
      const data: Dataset[] = await response.json();
      setDatasets(data);

      if (selectNewId !== undefined) {
        // Explicitly select the ID passed (usually after activation)
        setSelectedDatasetId(selectNewId);
      } else if (!selectedDatasetId) {
        // If no ID was selected previously and none is passed now, select the active one
        const activeDataset = data.find(d => d.is_active === 1);
        if (activeDataset) {
          setSelectedDatasetId(String(activeDataset.id));
        } else {
          setSelectedDatasetId(null); // Or select first? Current behavior: select none
        }
      }
      // If an ID was already selected, keep it selected unless explicitly changed

    } catch (err: any) {
      console.error("Error fetching datasets:", err);
      setDatasetsError(err.message || "An unknown error occurred while fetching datasets.");
      toast({
        variant: "destructive",
        title: "Error Fetching Datasets",
        description: err.message || "Could not load dataset list.",
      });
    } finally {
      setIsDatasetsLoading(false);
    }
  }, [toast, selectedDatasetId]); // Add selectedDatasetId dependency

  useEffect(() => {
    fetchDatasets(); // Initial fetch
  }, [fetchDatasets]); // Run when fetchDatasets function identity changes (which it won't due to useCallback, essentially runs once)
  // --- End Fetch Datasets ---

  const fetchReviews = useCallback(async () => { // Use useCallback here too
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Adapt this fetch call later if reviews should be filtered by selectedDatasetId
      const endpoint = useMockData ? '/api/mock/admin/reviews' : '/api/admin/reviews';
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
      }
      const data: Review[] = await response.json();
      setReviews(data);
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
      setError(err.message || "An unknown error occurred.");
      toast({
        variant: "destructive",
        title: "Error Fetching Reviews",
        description: err.message || "Could not load reviews.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [useMockData, toast]); // Dependencies for fetchReviews

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]); // Run when fetchReviews changes (due to useMockData)

  const handleMockDataToggle = (checked: boolean) => {
    setUseMockData(checked);
  };

  const handleDatasetChange = (value: string) => {
    setSelectedDatasetId(value === "" ? null : value); // Allow unselecting if placeholder is chosen
    console.log("Selected Dataset ID:", value);
  };

  const handleExport = async () => {
    if (!selectedDatasetId) {
      toast({ variant: "destructive", title: "Export Error", description: "Please select a dataset to export." });
      return;
    }
    setIsExporting(true);
    try {
      const response = await fetch(`/api/admin/export?datasetId=${selectedDatasetId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          toast({ variant: "default", title: "No Data", description: errorData.message || "No reviewed stories found to export." });
        } else {
          throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorData.error || 'Server error'}`);
        }
        setIsExporting(false);
        return;
      }
      const disposition = response.headers.get('Content-Disposition');
      let filename = `export_dataset_${selectedDatasetId}.json`;
      if (disposition?.includes('attachment')) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches?.[1]) filename = matches[1].replace(/['"]/g, '');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none'; a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast({ title: "Export Successful", description: `Downloaded ${filename}` });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({ variant: "destructive", title: "Export Error", description: err.message || "An unexpected error occurred." });
    } finally {
      setIsExporting(false);
    }
  };

  // --- Activate Handler ---
  const handleActivateDataset = async () => {
    if (!selectedDatasetId) {
      toast({ variant: "destructive", title: "Activation Error", description: "Please select a dataset to activate." });
      return;
    }

    const selectedDataset = datasets.find(d => String(d.id) === selectedDatasetId);
    if (selectedDataset?.is_active === 1) {
      toast({ title: "Info", description: "This dataset is already active." });
      return;
    }

    setIsActivating(true);
    try {
      const response = await fetch('/api/admin/datasets/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: parseInt(selectedDatasetId, 10) }), // Send ID as number
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Activation failed: ${response.status} ${response.statusText} - ${errorData.error || 'Server error'}`);
      }

      const result = await response.json();
      toast({ title: "Activation Successful", description: result.message || `Dataset ${selectedDataset?.name} activated.` });

      // Refetch datasets to update the active status in the dropdown
      // Pass the newly activated ID to keep it selected
      await fetchDatasets(selectedDatasetId);

    } catch (err: any) {
      console.error("Activation error:", err);
      toast({ variant: "destructive", title: "Activation Error", description: err.message || "An unexpected error occurred." });
    } finally {
      setIsActivating(false);
    }
  };
  // --- End Activate Handler ---

  // Determine if the currently selected dataset is the active one
  const isSelectedDatasetActive = datasets.find(d => String(d.id) === selectedDatasetId)?.is_active === 1;

  return (
      <div className="container mx-auto py-10 space-y-6">
        {/* Header remains the same */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin - Reviews & Datasets</h1>
          <div className="flex items-center space-x-2">
            <Switch id="mock-data-switch" checked={useMockData} onCheckedChange={handleMockDataToggle} aria-label="Toggle mock data" />
            <Label htmlFor="mock-data-switch">Use Mock Data</Label>
          </div>
        </div>


        {/* --- Dataset Operations Section --- */}
        <div className="flex items-center space-x-2 p-4 border rounded-md bg-card flex-wrap gap-y-2"> {/* Added flex-wrap and gap */}
          <Label htmlFor="dataset-select" className="whitespace-nowrap font-medium">Dataset Operations:</Label>
          <Select
              value={selectedDatasetId ?? ""}
              onValueChange={handleDatasetChange}
              disabled={isDatasetsLoading}
          >
            <SelectTrigger id="dataset-select" className="w-full sm:w-[300px] md:w-[350px]"> {/* Responsive width */}
              <SelectValue placeholder={isDatasetsLoading ? "Loading datasets..." : "Select a dataset"} />
            </SelectTrigger>
            <SelectContent>
              {isDatasetsLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
              {datasetsError && <SelectItem value="error" disabled>Error loading datasets</SelectItem>}
              {!isDatasetsLoading && !datasetsError && datasets.length === 0 && <SelectItem value="no-datasets" disabled>No datasets found</SelectItem>}
              {!isDatasetsLoading && !datasetsError && datasets.length > 0 &&
                  datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={String(dataset.id)}>
                        {dataset.name} ({dataset.filename}) {dataset.is_active ? <span className="text-green-600 font-semibold ml-1">(Active)</span> : ''}
                      </SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
          <Button
              onClick={handleActivateDataset}
              disabled={!selectedDatasetId || isSelectedDatasetActive || isActivating || isDatasetsLoading}
              variant={isSelectedDatasetActive ? "secondary" : "default"} // Visual cue if active
          >
            {isActivating ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : isSelectedDatasetActive ? ( <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>) : null }
            {isSelectedDatasetActive ? 'Active' : 'Set Active'}
          </Button>
          <Button
              onClick={handleExport}
              disabled={!selectedDatasetId || isExporting || isDatasetsLoading}
          >
            {isExporting ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Download className="mr-2 h-4 w-4" /> )}
            Export Reviewed
          </Button>
        </div>
        {datasetsError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Fetching Datasets</AlertTitle>
              <AlertDescription>{datasetsError}</AlertDescription>
            </Alert>
        )}
        {/* --- End Dataset Selector & Export Button --- */}


        {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Fetching Reviews</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {isLoading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading reviews...</span>
            </div>
        ) : (
            // TODO: Filter this data based on selectedDatasetId if required in the future
            <DataTable columns={columns} data={reviews} />
        )}
      </div>
  );
}