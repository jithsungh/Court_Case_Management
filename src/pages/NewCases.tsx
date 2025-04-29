
import { useEffect, useState } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { Case } from "@/services/types";
import { CaseCards } from "@/components/cases/CaseCards";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const NewCases = () => {
  const { cases } = useFirebaseData();
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter cases that are in "filed" status (cases ready for clerk to process)
  useEffect(() => {
    let result = cases.filter((c) => c.status === "filed");

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.plaintiff?.name?.toLowerCase().includes(query) ||
          c.defendant?.name?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter((c) => c.type === typeFilter);
    }

    setFilteredCases(result);
  }, [cases, searchQuery, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cases Ready for Processing</h1>
        <p className="text-muted-foreground">
          Process filed cases where both parties have legal representation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search-cases">Search Cases</Label>
          <Input
            id="search-cases"
            placeholder="Search by title, description, or parties involved..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type-filter">Case Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="civil">Civil</SelectItem>
              <SelectItem value="criminal">Criminal</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="bankruptcy">Bankruptcy</SelectItem>
              <SelectItem value="tax">Tax</SelectItem>
              <SelectItem value="immigration">Immigration</SelectItem>
              <SelectItem value="intellectual_property">
                Intellectual Property
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CaseCards cases={filteredCases} title="Filed Cases" showProcessButton={true} />
    </div>
  );
};

export default NewCases;
