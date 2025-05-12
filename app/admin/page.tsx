"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns, type Review } from "./columns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Dataset {
  id: number;
  name: string;
  filename: string;
  is_active: number;
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

  const [isActivating, setIsActivating] = useState(false);

  const fetchDatasets = useCallback(
    async (selectNewId?: string | null) => {
      setIsDatasetsLoading(true);
      setDatasetsError(null);

      try {
        const response = await fetch("/api/admin/datasets");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch datasets: ${response.status} ${response.statusText} - ${errorData.error || ""}`
          );
        }
        const data: Dataset[] = await response.json();
        setDatasets(data);

        if (selectNewId !== undefined) {
          setSelectedDatasetId(selectNewId);
        } else if (!selectedDatasetId) {
          const activeDataset = data.find((d) => d.is_active === 1);
          if (activeDataset) {
            setSelectedDatasetId(String(activeDataset.id));
          } else {
            setSelectedDatasetId(null);
          }
        }
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
    },
    [toast, selectedDatasetId]
  );

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = useMockData ? "/api/mock/admin/reviews" : "/api/admin/reviews";
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch reviews: ${response.status} ${response.statusText} - ${errorData.error || ""}`
        );
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
  }, [useMockData, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleMockDataToggle = (checked: boolean) => {
    setUseMockData(checked);
  };

  const handleDatasetChange = (value: string) => {
    setSelectedDatasetId(value === "" ? null : value);
    console.log("Selected Dataset ID:", value);
  };

  const handleExport = async () => {
    if (!selectedDatasetId) {
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "Please select a dataset to export.",
      });
      return;
    }
    setIsExporting(true);
    try {
      const response = await fetch(`/api/admin/export?datasetId=${selectedDatasetId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          toast({
            variant: "default",
            title: "No Data",
            description: errorData.message || "No reviewed stories found to export.",
          });
        } else {
          throw new Error(
            `Export failed: ${response.status} ${response.statusText} - ${errorData.error || "Server error"}`
          );
        }
        setIsExporting(false);
        return;
      }
      const disposition = response.headers.get("Content-Disposition");
      let filename = `export_dataset_${selectedDatasetId}.json`;
      if (disposition?.includes("attachment")) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches?.[1]) filename = matches[1].replace(/['"]/g, "");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Export Successful", description: `Downloaded ${filename}` });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({
        variant: "destructive",
        title: "Export Error",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleActivateDataset = async () => {
    if (!selectedDatasetId) {
      toast({
        variant: "destructive",
        title: "Activation Error",
        description: "Please select a dataset to activate.",
      });
      return;
    }

    const selectedDataset = datasets.find((d) => String(d.id) === selectedDatasetId);
    if (selectedDataset?.is_active === 1) {
      toast({ title: "Info", description: "This dataset is already active." });
      return;
    }

    setIsActivating(true);
    try {
      const response = await fetch("/api/admin/datasets/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: parseInt(selectedDatasetId, 10) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Activation failed: ${response.status} ${response.statusText} - ${errorData.error || "Server error"}`
        );
      }

      const result = await response.json();
      toast({
        title: "Activation Successful",
        description: result.message || `Dataset ${selectedDataset?.name} activated.`,
      });

      await fetchDatasets(selectedDatasetId);
    } catch (err: any) {
      console.error("Activation error:", err);
      toast({
        variant: "destructive",
        title: "Activation Error",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const isSelectedDatasetActive =
    datasets.find((d) => String(d.id) === selectedDatasetId)?.is_active === 1;

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header remains the same */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Administration - Annotations & Jeux de données</h1>
        <div className="flex items-center space-x-2">
          <Switch
            id="mock-data-switch"
            checked={useMockData}
            onCheckedChange={handleMockDataToggle}
            aria-label="Basculer sur les données de test"
          />
          <Label htmlFor="mock-data-switch">Données de test</Label>
        </div>
      </div>

      {/* --- Dataset Operations Section --- */}
      <div className="flex items-center space-x-2 p-4 border rounded-md bg-card flex-wrap gap-y-2">
        {" "}
        {/* Added flex-wrap and gap */}
        <Label htmlFor="dataset-select" className="whitespace-nowrap font-medium">
          Dataset Operations:
        </Label>
        <Select
          value={selectedDatasetId ?? ""}
          onValueChange={handleDatasetChange}
          disabled={isDatasetsLoading}
        >
          <SelectTrigger id="dataset-select" className="w-full sm:w-[300px] md:w-[350px]">
            {" "}
            {/* Responsive width */}
            <SelectValue
              placeholder={isDatasetsLoading ? "Loading datasets..." : "Select a dataset"}
            />
          </SelectTrigger>
          <SelectContent>
            {isDatasetsLoading && (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            )}
            {datasetsError && (
              <SelectItem value="error" disabled>
                Error loading datasets
              </SelectItem>
            )}
            {!isDatasetsLoading && !datasetsError && datasets.length === 0 && (
              <SelectItem value="no-datasets" disabled>
                No datasets found
              </SelectItem>
            )}
            {!isDatasetsLoading &&
              !datasetsError &&
              datasets.length > 0 &&
              datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={String(dataset.id)}>
                  {dataset.name} ({dataset.filename}){" "}
                  {dataset.is_active ? (
                    <span className="text-green-600 font-semibold ml-1">(Active)</span>
                  ) : (
                    ""
                  )}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleActivateDataset}
          disabled={
            !selectedDatasetId || isSelectedDatasetActive || isActivating || isDatasetsLoading
          }
          variant={isSelectedDatasetActive ? "secondary" : "default"}
        >
          {isActivating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isSelectedDatasetActive ? (
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
          ) : null}
          {isSelectedDatasetActive ? "Active" : "Set Active"}
        </Button>
        <Button
          onClick={handleExport}
          disabled={!selectedDatasetId || isExporting || isDatasetsLoading}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export Reviewed
        </Button>
      </div>
      {datasetsError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur lors du chargement des jeux de données</AlertTitle>
          <AlertDescription>{datasetsError}</AlertDescription>
        </Alert>
      )}
      {/* --- End Dataset Selector & Export Button --- */}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur lors du chargement des annotations</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Chargement des annotations...</span>
        </div>
      ) : (
        <DataTable columns={columns} data={reviews} />
      )}
    </div>
  );
}
