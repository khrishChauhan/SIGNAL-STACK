"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Company } from "@/types/api";
import { api } from "@/lib/api-client";

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company) => void;
  isLoading: boolean;
  refreshCompanies: () => Promise<void>;
  isNewCompanyModalOpen: boolean;
  setIsNewCompanyModalOpen: (open: boolean) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState<boolean>(false);

  const refreshCompanies = async () => {
    try {
      setIsLoading(true);
      const list = await api.listCompanies();
      setCompanies(list);

      // Preserve existing selected company if still exists, or default to MeetUniversity / first
      if (list.length > 0) {
        setSelectedCompany((prev) => {
          if (prev) {
            const found = list.find((c) => c.id === prev.id);
            if (found) return found;
          }
          // Prefer MeetUniversity as primary demo company
          const meetUni = list.find((c) => c.name.toLowerCase().includes("meetuniversity"));
          return meetUni || list[0];
        });
      }
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        setSelectedCompany,
        isLoading,
        refreshCompanies,
        isNewCompanyModalOpen,
        setIsNewCompanyModalOpen,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
