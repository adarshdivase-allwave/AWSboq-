
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import { ClientDetails, Room, BrandingSettings, Currency, CURRENCIES, BoqItem } from '../types';
import { companyTemplate } from '../data/scopeAndTermsData';
import { getExchangeRates } from './currency';
import { LOGO_DATA } from '../data/logoData';

// Colors based on screenshots
const COLORS = {
    HEADER_GREEN: 'FF92D050', // Bright Green for Version/Contact Headers
    HEADER_PEACH: 'FFF8CBAD', // Peach/Pink for Scope/Room Info Headers
    HEADER_BLUE: 'FFBDD7EE',  // Light Blue for BOQ Table Headers
    DISCLAIMER_GREEN: 'FFC6E0B4', // Light Green for Disclaimer Box
    BORDER_GREY: 'FF000000',  // Standard Black Border
    WHITE: 'FFFFFFFF',
};

// Helper to add standard logos to a worksheet
const addLogosToSheet = (workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, branding: BrandingSettings) => {
    // Add Main Logo (All Wave AV) - Top Left
    const logoId = workbook.addImage({
        base64: branding.logoUrl || LOGO_DATA.allWave,
        extension: 'png',
    });
    worksheet.addImage(logoId, {
        tl: { col: 1, row: 0 }, // Col B, Row 1
        ext: { width: 180, height: 60 },
    });

    // Add Partner Logos (PSNI / AVIXA) - Top Right
    // We place them roughly around column G/H depending on sheet width
    const psniId = workbook.addImage({
        base64: LOGO_DATA.psni,
        extension: 'png',
    });
    const avixaId = workbook.addImage({
        base64: LOGO_DATA.avixa,
        extension: 'png',
    });

    // Position depends on the sheet, but generally top right
    // We'll use a fixed position for now, adjustable
    worksheet.addImage(psniId, {
        tl: { col: 6, row: 0 }, 
        ext: { width: 100, height: 50 },
    });
    worksheet.addImage(avixaId, {
        tl: { col: 7, row: 0 }, 
        ext: { width: 80, height: 50 },
    });
};

const setCellStyle = (cell: ExcelJS.Cell, fillArgB: string | null, bold: boolean = false, border: boolean = true, alignCenter: boolean = false) => {
    if (fillArgB) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillArgB }
        };
    }
    cell.font = {
        name: 'Arial',
        size: 10,
        bold: bold,
    };
    if (border) {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }
    if (alignCenter) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    } else {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    }
};

export const exportToXlsx = async (
    rooms: Room[],
    clientDetails: ClientDetails,
    margin: number,
    branding: BrandingSettings,
    selectedCurrency: Currency,
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = branding.companyInfo.name;
    workbook.created = new Date();

    const rates = await getExchangeRates();
    const rate = rates[selectedCurrency] || 1;
    const isINR = selectedCurrency === 'INR';
    const currencySymbol = CURRENCIES.find(c => c.value === selectedCurrency)?.symbol || '';
    const gstRate = 0.18;

    // ==========================================
    // SHEET 1: Version Control & Contact Details
    // ==========================================
    const coverSheet = workbook.addWorksheet('Cover Page');
    
    // Setup Columns
    coverSheet.columns = [
        { width: 2 },  // A (Margin)
        { width: 20 }, // B
        { width: 20 }, // C
        { width: 5 },  // D (Spacer)
        { width: 25 }, // E
        { width: 40 }, // F
    ];

    // Add Logos
    addLogosToSheet(workbook, coverSheet, branding);

    // Spacer rows for logos
    coverSheet.addRow([]); 
    coverSheet.addRow([]);
    coverSheet.addRow([]);

    // --- Version Control Table (Left) ---
    const row4 = coverSheet.getRow(4);
    row4.getCell(2).value = "Version Control";
    row4.getCell(2).font = { bold: true };
    row4.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.HEADER_GREEN } };
    coverSheet.mergeCells('B4:C4');
    setCellStyle(row4.getCell(2), COLORS.HEADER_GREEN, true, true, true);
    
    // Headers
    const row5 = coverSheet.getRow(5);
    row5.getCell(2).value = "Date of First Draft";
    row5.getCell(3).value = "Date of Final Draft";
    setCellStyle(row5.getCell(2), null, false, true);
    setCellStyle(row5.getCell(3), null, false, true);
    
    // Values (Placeholders)
    const row6 = coverSheet.getRow(6);
    row6.getCell(2).value = clientDetails.date;
    row6.getCell(3).value = clientDetails.date; // Assuming same for now
    setCellStyle(row6.getCell(2), null, false, true);
    setCellStyle(row6.getCell(3), null, false, true);

    // Empty rows
    for (let i = 7; i <= 8; i++) {
        const r = coverSheet.getRow(i);
        setCellStyle(r.getCell(2), null, false, true);
        setCellStyle(r.getCell(3), null, false, true);
    }

    const row9 = coverSheet.getRow(9);
    row9.getCell(2).value = "Version No.";
    row9.getCell(3).value = "Published Date";
    setCellStyle(row9.getCell(2), COLORS.HEADER_GREEN, false, true);
    setCellStyle(row9.getCell(3), COLORS.HEADER_GREEN, false, true);

    const row10 = coverSheet.getRow(10);
    row10.getCell(2).value = "1.0";
    row10.getCell(3).value = clientDetails.date;
    setCellStyle(row10.getCell(2), null, false, true);
    setCellStyle(row10.getCell(3), null, false, true);


    // --- Contact Details Table (Right) ---
    // Header
    const cdHeader = coverSheet.getCell('E4');
    cdHeader.value = "Contact Details";
    cdHeader.font = { bold: true };
    coverSheet.mergeCells('E4:F4');
    setCellStyle(cdHeader, COLORS.HEADER_GREEN, true, true, true);

    const contactFields = [
        ["Design Engineer", clientDetails.designEngineer],
        ["Account Manager", clientDetails.accountManager],
        ["Client Name", clientDetails.clientName],
        ["Key Client Personnel", clientDetails.keyClientPersonnel],
        ["Location", clientDetails.location],
        ["Key Comments for this version", clientDetails.keyComments]
    ];

    contactFields.forEach((field, index) => {
        const r = coverSheet.getRow(5 + index);
        r.getCell(5).value = field[0];
        r.getCell(6).value = field[1];
        setCellStyle(r.getCell(5), COLORS.HEADER_GREEN, false, true);
        setCellStyle(r.getCell(6), null, false, true);
    });

    // ==========================================
    // SHEET 2: Scope of Work
    // ==========================================
    const scopeSheet = workbook.addWorksheet('Scope of Work');
    scopeSheet.columns = [
        { width: 2 },  // A
        { width: 10 }, // B (Sr No)
        { width: 100 }, // C (Particulars)
    ];

    addLogosToSheet(workbook, scopeSheet, branding);
    scopeSheet.addRow([]); scopeSheet.addRow([]); scopeSheet.addRow([]);

    // Disclaimer Box
    const disclaimerRow = scopeSheet.getRow(4);
    disclaimerRow.getCell(2).value = "Note: This SoW describes the Scope of the Assignment, the Terms, and the Timelines for delivery in order to formalize this assignment. It also intends to share with you the processes and systems that we follow in our engagements with Client.";
    scopeSheet.mergeCells('B4:C5'); // Merge vertically for space
    disclaimerRow.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
    setCellStyle(disclaimerRow.getCell(2), COLORS.DISCLAIMER_GREEN, false, true);
    setCellStyle(scopeSheet.getCell('C4'), COLORS.DISCLAIMER_GREEN, false, true); // Ensure style covers merge
    setCellStyle(scopeSheet.getCell('B5'), COLORS.DISCLAIMER_GREEN, false, true);
    setCellStyle(scopeSheet.getCell('C5'), COLORS.DISCLAIMER_GREEN, false, true);

    // Helper for Scope Sections
    const addScopeSection = (title: string, items: any[][]) => {
        scopeSheet.addRow([]); // Spacer
        const headerRow = scopeSheet.addRow(['', title]);
        setCellStyle(headerRow.getCell(2), COLORS.HEADER_PEACH, true, true);
        scopeSheet.mergeCells(`B${headerRow.number}:C${headerRow.number}`); // Merge title

        const subHeaderRow = scopeSheet.addRow(['', 'Sr. No', 'Particulars']);
        setCellStyle(subHeaderRow.getCell(2), COLORS.HEADER_PEACH, true, true, true);
        setCellStyle(subHeaderRow.getCell(3), COLORS.HEADER_PEACH, true, true, true);

        items.forEach(item => {
            const r = scopeSheet.addRow(['', item[0], item[1]]);
            setCellStyle(r.getCell(2), null, false, true, true); // Sr No Center
            setCellStyle(r.getCell(3), null, false, true, false); // Particulars Left
        });
    };

    addScopeSection("Scope of Work", companyTemplate.commercialTerms["Scope of Work"].slice(1));
    addScopeSection("Exclusions and Dependencies", companyTemplate.commercialTerms["Exclusions and Dependencies"].slice(1));
    
    // ==========================================
    // SHEET 3: Proposal Summary
    // ==========================================
    const summarySheet = workbook.addWorksheet('Proposal Summary');
    summarySheet.columns = [
        { width: 2 },
        { width: 10 }, // Sr No
        { width: 60 }, // Description
        { width: 25 }, // Total
    ];

    addLogosToSheet(workbook, summarySheet, branding);
    summarySheet.addRow([]); summarySheet.addRow([]); summarySheet.addRow([]);

    // Main Header
    const sumTitleRow = summarySheet.getRow(4);
    sumTitleRow.getCell(2).value = "Proposal Summary";
    summarySheet.mergeCells('B4:D4');
    setCellStyle(sumTitleRow.getCell(2), COLORS.HEADER_GREEN, true, true);

    // Table Header
    const sumHeadRow = summarySheet.getRow(5);
    sumHeadRow.getCell(2).value = "Sr. No";
    sumHeadRow.getCell(3).value = "Description";
    sumHeadRow.getCell(4).value = "Total";
    [2, 3, 4].forEach(c => setCellStyle(sumHeadRow.getCell(c), null, true, true, true)); // White/Plain headers in screenshot for this table, or Green? Lets use Standard.

    let projectGrandTotal = 0;
    rooms.forEach((room, index) => {
        if (room.boq) {
            let roomTotal = 0;
            room.boq.forEach(item => {
                const itemMarginPercent = typeof item.margin === 'number' ? item.margin : margin;
                const itemMarginMultiplier = 1 + itemMarginPercent / 100;
                roomTotal += (item.totalPrice * rate) * itemMarginMultiplier;
            });
            const roomFinalTotal = roomTotal * (1 + gstRate);
            projectGrandTotal += roomFinalTotal;

            const r = summarySheet.addRow(['', index + 1, room.name, roomFinalTotal]);
            setCellStyle(r.getCell(2), null, false, true, true);
            setCellStyle(r.getCell(3), null, false, true, false);
            setCellStyle(r.getCell(4), null, false, true, false);
            r.getCell(4).numFmt = `"${currencySymbol}"#,##0.00`;
        }
    });

    // Grand Total
    const grandTotalRow = summarySheet.addRow(['', '', 'Grand Total', projectGrandTotal]);
    setCellStyle(grandTotalRow.getCell(3), null, true, true);
    setCellStyle(grandTotalRow.getCell(4), null, true, true);
    grandTotalRow.getCell(4).numFmt = `"${currencySymbol}"#,##0.00`;

    // ==========================================
    // SHEET 4+: Room BOQs
    // ==========================================
    rooms.forEach((room) => {
        if (!room.boq) return;

        const sheet = workbook.addWorksheet(room.name.substring(0, 31));
        
        // Col Widths
        sheet.columns = [
            { width: 2 }, // A Margin
            { width: 8 }, // B Sr
            { width: 40 }, // C Desc
            { width: 25 }, // D Specs
            { width: 15 }, // E Make
            { width: 15 }, // F Model
            { width: 8 }, // G Qty
            { width: 15 }, // H Unit
            { width: 15 }, // I Total
            { width: 12 }, // J Tax
            { width: 12 }, // K Tax 2
            { width: 18 }, // L Total
            { width: 20 }, // M Remarks
            { width: 20 }, // N Image
        ];

        addLogosToSheet(workbook, sheet, branding);
        sheet.addRow([]); sheet.addRow([]); sheet.addRow([]);

        // --- Room Info Block (Peach/Pink) ---
        // Row 4: Name
        const r4 = sheet.getRow(4);
        r4.getCell(2).value = "Room Name / Room Type";
        r4.getCell(3).value = room.name;
        sheet.mergeCells('C4:N4'); // Merge value across
        setCellStyle(r4.getCell(2), COLORS.HEADER_PEACH, true, true);
        setCellStyle(r4.getCell(3), null, false, true);

        // Row 5: Floor
        const r5 = sheet.getRow(5);
        r5.getCell(2).value = "Floor";
        r5.getCell(3).value = "-";
        sheet.mergeCells('C5:N5');
        setCellStyle(r5.getCell(2), COLORS.HEADER_PEACH, true, true);
        setCellStyle(r5.getCell(3), null, false, true);

        // Row 6: Seats
        const r6 = sheet.getRow(6);
        r6.getCell(2).value = "Number of Seats";
        r6.getCell(3).value = room.answers.capacity || "-";
        sheet.mergeCells('C6:N6');
        setCellStyle(r6.getCell(2), COLORS.HEADER_PEACH, true, true);
        setCellStyle(r6.getCell(3), null, false, true);

        // Row 7: Room Qty
        const r7 = sheet.getRow(7);
        r7.getCell(2).value = "Number of Rooms";
        r7.getCell(3).value = "1";
        sheet.mergeCells('C7:N7');
        setCellStyle(r7.getCell(2), COLORS.HEADER_PEACH, true, true);
        setCellStyle(r7.getCell(3), null, false, true);

        sheet.addRow([]); // Spacer

        // --- BOQ Table ---
        const headerLabels = [
            "Sr. No.", "Description of Goods / Services", "Specifications", "Make", "Model No.", "Qty.", 
            `Unit Rate (${selectedCurrency})`, "Total", 
            isINR ? "SGST (9%)" : `Tax (${gstRate*100}%)`, 
            isINR ? "CGST (9%)" : " ",
            `Total (${selectedCurrency})`, "Remarks", "Reference Image"
        ];

        const tableHeadRow = sheet.addRow(['', ...headerLabels]);
        // Apply Blue Header Style
        for(let c=2; c<=14; c++) {
            setCellStyle(tableHeadRow.getCell(c), COLORS.HEADER_BLUE, true, true, true);
        }

        let srNo = 1;
        let roomSubTotal = 0;
        let roomTaxTotal = 0;
        let roomGrandTotal = 0;

        // Group items
         const groupedBoq = room.boq.reduce((acc, item) => {
            const cat = item.category || 'Uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {} as Record<string, BoqItem[]>);

        const catOrder = [
             "Display", "Video Conferencing & Cameras", "Video Distribution & Switching",
             "Audio - Microphones", "Audio - DSP & Amplification", "Audio - Speakers",
             "Control System & Environmental", "Acoustic Treatment", "Cabling & Infrastructure",
             "Mounts & Racks", "Accessories & Services"
        ];
        const sortedCats = Object.keys(groupedBoq).sort((a, b) => {
            const idxA = catOrder.indexOf(a);
            const idxB = catOrder.indexOf(b);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });

        sortedCats.forEach(cat => {
            // Category Header - Light Grey or Peach
            const catRow = sheet.addRow(['', cat]);
            sheet.mergeCells(`B${catRow.number}:N${catRow.number}`);
            setCellStyle(catRow.getCell(2), 'FFD9D9D9', true, true); // Light Grey

            groupedBoq[cat].forEach(item => {
                const unitPrice = item.unitPrice * rate;
                const marginMult = 1 + (item.margin ?? margin) / 100;
                const finalUnit = unitPrice * marginMult;
                const totalBasic = finalUnit * item.quantity;
                
                const sgst = isINR ? totalBasic * 0.09 : 0;
                const cgst = isINR ? totalBasic * 0.09 : 0;
                const tax = !isINR ? totalBasic * gstRate : 0;
                const lineTotal = totalBasic + sgst + cgst + tax;

                roomSubTotal += totalBasic;
                if (isINR) roomTaxTotal += (sgst + cgst);
                else roomTaxTotal += tax;
                roomGrandTotal += lineTotal;

                const row = sheet.addRow([
                    '',
                    srNo++,
                    item.itemDescription,
                    item.itemDescription, // Specs placeholder
                    item.brand,
                    item.model,
                    item.quantity,
                    finalUnit,
                    totalBasic,
                    isINR ? sgst : tax,
                    isINR ? cgst : '',
                    lineTotal,
                    '', // Remarks
                    ''  // Image
                ]);

                // Styling
                setCellStyle(row.getCell(2), null, false, true, true); // Sr
                setCellStyle(row.getCell(3), null, false, true, false); // Desc
                setCellStyle(row.getCell(4), null, false, true, false); // Specs
                setCellStyle(row.getCell(5), null, false, true, true); // Make
                setCellStyle(row.getCell(6), null, false, true, true); // Model
                setCellStyle(row.getCell(7), null, false, true, true); // Qty
                setCellStyle(row.getCell(8), null, false, true, false); // Unit
                setCellStyle(row.getCell(9), null, false, true, false); // Total
                setCellStyle(row.getCell(10), null, false, true, false); // Tax
                setCellStyle(row.getCell(11), null, false, true, false); // Tax 2
                setCellStyle(row.getCell(12), null, false, true, false); // Final
                setCellStyle(row.getCell(13), null, false, true, false); // Rem
                setCellStyle(row.getCell(14), null, false, true, false); // Img

                [8,9,10,11,12].forEach(idx => row.getCell(idx).numFmt = `"${currencySymbol}"#,##0.00`);
            });
        });

        sheet.addRow([]);

        // Footer Totals
        const totalBasicRow = sheet.addRow(['', '', 'Total (Basic)', '', '', '', '', '', roomSubTotal, '', '', '', '', '']);
        setCellStyle(totalBasicRow.getCell(3), null, true, true);
        setCellStyle(totalBasicRow.getCell(9), null, true, true);
        totalBasicRow.getCell(9).numFmt = `"${currencySymbol}"#,##0.00`;

        const taxRow = sheet.addRow(['', '', 'Total Tax', '', '', '', '', '', '', roomTaxTotal, '', '', '', '']);
        setCellStyle(taxRow.getCell(3), null, true, true);
        setCellStyle(taxRow.getCell(10), null, true, true);
        taxRow.getCell(10).numFmt = `"${currencySymbol}"#,##0.00`;

        // Grand Total Footer (Blue Headers Style)
        const footerHeaderRow = sheet.addRow(['', 'Grand Total', '', '', '', '', '', '', '', '', '', roomGrandTotal, 'Remarks', 'Reference Image']);
        
        // Re-do footer to match Screenshot 13:50 (Total, Remarks, Image at bottom)
        sheet.addRow([]);
        const fRow1 = sheet.addRow(['', 'Total (TAX)', 'Remarks', 'Reference Image']);
        
        const grandRow = sheet.addRow(['', 'Grand Total Including Tax:', '', '', '', '', '', '', '', '', '', roomGrandTotal]);
        sheet.mergeCells(`B${grandRow.number}:K${grandRow.number}`);
        setCellStyle(grandRow.getCell(2), COLORS.HEADER_BLUE, true, true, false); // Label
        setCellStyle(grandRow.getCell(12), COLORS.HEADER_BLUE, true, true, false); // Value
        grandRow.getCell(12).numFmt = `"${currencySymbol}"#,##0.00`;

    });

    // Write Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, `${clientDetails.projectName || 'Proposal'}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
