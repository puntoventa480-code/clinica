
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Patient, Appointment, InventoryHistoryEntry, FixedExpense, DistributionConfig, User } from "../types";

export const generateMasterReportPDF = (data: {
  patients: Patient[];
  appointments: Appointment[];
  inventoryHistory: InventoryHistoryEntry[];
  fixedExpenses: FixedExpense[];
  otherExpenses: FixedExpense[];
  config: DistributionConfig;
  users: User[];
}) => {
  const { patients, appointments, inventoryHistory, fixedExpenses, otherExpenses, config, users } = data;
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString();

  // --- ENCABEZADO ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NOAH'S AGENCY", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Gestión Clínica Estomatológica Integral", 14, 28);
  doc.text(`Fecha de Emisión: ${dateStr}`, pageWidth - 14, 20, { align: "right" });
  doc.text("Reporte Ejecutivo Maestro de Cierre", pageWidth - 14, 28, { align: "right" });

  let currentY = 50;

  // --- CÁLCULOS ---
  const allRecords = patients.flatMap(p => p.history);
  const totalIncomeCUP = allRecords.reduce((sum, r) => sum + r.amountPaidCUP, 0) + 
                         appointments.filter(a => a.status !== 'cancelled').reduce((sum, a) => sum + (a.reservationFeeCUP || 0), 0);
  
  const totalFixedCUP = fixedExpenses.reduce((sum, e) => sum + e.amountCUP, 0);
  const totalOtherCUP = otherExpenses.reduce((sum, e) => sum + e.amountCUP, 0);
  const totalOpsCUP = totalFixedCUP + totalOtherCUP;

  const totalCommissionsCUP = allRecords.reduce((sum, r) => sum + (r.amountPaidCUP * (config.doctorCommission / 100)), 0);
  
  const clinicProfitCUP = totalIncomeCUP - totalOpsCUP - totalCommissionsCUP;
  let totalInvestorCUP = 0;
  config.funds.forEach(f => {
    if (f.name.toLowerCase().includes('inversor')) {
      totalInvestorCUP += Math.max(0, clinicProfitCUP * (f.percentage / 100));
    }
  });

  const grandTotalExpensesCUP = totalOpsCUP + totalCommissionsCUP + totalInvestorCUP;
  const netProfitCUP = totalIncomeCUP - grandTotalExpensesCUP;

  // --- SECCIÓN 1: BALANCE MAESTRO DE CIERRE ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text("1. Balance Consolidado de Cierre", 14, currentY);
  currentY += 5;

  doc.autoTable({
    startY: currentY,
    head: [['Rubro Financiero', 'Monto (CUP)']],
    body: [
      ['Ingreso Bruto del Periodo', `$ ${totalIncomeCUP.toLocaleString()}`],
      ['(-) Gastos Operativos (Fijos + Otros)', `$ ${totalOpsCUP.toLocaleString()}`],
      ['(-) Honorarios Médicos', `$ ${totalCommissionsCUP.toLocaleString()}`],
      ['(-) Participación Socio Inversor', `$ ${totalInvestorCUP.toLocaleString()}`],
      [{ content: 'TOTAL GASTOS Y RETENCIONES', styles: { fontStyle: 'bold' } }, { content: `$ ${grandTotalExpensesCUP.toLocaleString()}`, styles: { fontStyle: 'bold' } }],
      [{ content: 'GANANCIA NETA REAL (CAJA)', styles: { fontStyle: 'bold', fillColor: [16, 185, 129], textColor: [255, 255, 255] } }, { content: `$ ${Math.max(0, netProfitCUP).toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [16, 185, 129], textColor: [255, 255, 255] } }],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- SECCIÓN 2: OTROS FONDOS DISTRIBUIDOS ---
  doc.setTextColor(15, 23, 42);
  doc.text("2. Distribución de Utilidades (Fondos de Reserva)", 14, currentY);
  currentY += 5;

  const distributionRows = config.funds.map(fund => [
    fund.name,
    `${fund.percentage}%`,
    `$ ${Math.max(0, clinicProfitCUP * (fund.percentage / 100)).toLocaleString()} CUP`
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['Concepto / Fondo', 'Porcentaje', 'Monto Distribuido']],
    body: distributionRows,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233] }, 
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- PIE DE PÁGINA ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount} - Noah's Agency Dental Management Suite`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  doc.save(`Balance_Cierre_Maestro_${dateStr.replace(/\//g, '-')}.pdf`);
};
