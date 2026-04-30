import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 48,
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
  },
  header: {
    marginBottom: 24,
    borderBottom: "2pt solid #3b82f6",
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 6,
  },
  description: {
    fontSize: 11,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  metaBadge: {
    fontSize: 9,
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "3 8",
    borderRadius: 4,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
    backgroundColor: "#eff6ff",
    padding: "8 12",
    borderRadius: 4,
    marginBottom: 10,
  },
  stepContainer: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeft: "3pt solid #93c5fd",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#3b82f6",
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: "center",
    paddingTop: 5,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    paddingTop: 3,
  },
  stepDescription: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.6,
    paddingLeft: 28,
  },
  note: {
    fontSize: 9,
    color: "#92400e",
    backgroundColor: "#fef3c7",
    padding: "4 8",
    borderRadius: 3,
    marginTop: 4,
    marginLeft: 28,
  },
  checklistPage: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 48,
    backgroundColor: "#ffffff",
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 16,
    borderBottom: "2pt solid #3b82f6",
    paddingBottom: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
    padding: "8 10",
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    border: "1.5pt solid #9ca3af",
    borderRadius: 3,
    marginTop: 1,
  },
  checklistText: {
    flex: 1,
    fontSize: 11,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
    borderTop: "0.5pt solid #e5e7eb",
    paddingTop: 8,
  },
});

interface StepData {
  title: string;
  description: string;
  note: string | null;
  order_index: number;
}

interface SectionData {
  title: string;
  steps: StepData[];
}

interface ManualPDFProps {
  title: string;
  description?: string;
  estimatedTime?: string;
  sections: SectionData[];
}

export function ManualPDF({ title, description, estimatedTime, sections }: ManualPDFProps) {
  let globalStep = 1;
  const allSteps: Array<{ title: string; sectionTitle: string }> = [];

  for (const section of sections) {
    for (const step of section.steps) {
      allSteps.push({ title: step.title, sectionTitle: section.title });
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
          {estimatedTime && (
            <View style={styles.metaRow}>
              <Text style={styles.metaBadge}>⏱ {estimatedTime}</Text>
              <Text style={styles.metaBadge}>{allSteps.length} steps</Text>
            </View>
          )}
        </View>

        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.steps.map((step, stepIdx) => {
              const num = globalStep++;
              return (
                <View key={stepIdx} style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepNumber}>{num}</Text>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {step.note && (
                    <Text style={styles.note}>💡 {step.note}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Generated by VidManual</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={styles.checklistPage}>
        <Text style={styles.checklistTitle}>✓ Checklist: {title}</Text>
        {allSteps.map((item, idx) => (
          <View key={idx} style={styles.checklistItem}>
            <View style={styles.checkbox} />
            <Text style={styles.checklistText}>
              Step {idx + 1}: {item.title}
            </Text>
          </View>
        ))}
        <View style={styles.footer} fixed>
          <Text>Generated by VidManual</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
