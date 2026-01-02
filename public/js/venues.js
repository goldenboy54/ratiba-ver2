// Venues Page JavaScript
$(document).ready(function() {
  // Initialize Select2
  $('.select2').select2({
    theme: 'bootstrap-5',
    width: '100%'
  });

  // Auto filter on selection change
  $('.filterInput').on('change', function() {
    const form = $('#filterForm');
    const url = new URL(window.location.href);
    
    form.find('select').each(function() {
      const val = $(this).val();
      if(val) {
        url.searchParams.set($(this).attr('name'), val);
      } else {
        url.searchParams.delete($(this).attr('name'));
      }
    });
    
    window.location.href = url.toString();
  });

  // Generate file name with timestamp
  function getFileName(prefix) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + '_' + 
                    now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
    return `${prefix}_filteredData_${dateStr}`;
  }

  // CSV Download
  $('#downloadCSV').click(function() {
    const rows = [];
    $('#venuesTable tr').each(function() {
      const cols = [];
      $(this).find('th, td').each(function() {
        cols.push('"' + $(this).text().trim().replace(/"/g, '""') + '"');
      });
      rows.push(cols.join(','));
    });
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName('ATC_Venues') + '.csv';
    link.click();
    URL.revokeObjectURL(url);
  });

  // Print Table
  $('#printTable').click(function() {
    const printContents = document.getElementById('venuesTableContainer').innerHTML;
    const win = window.open('', '', 'width=1000,height=800');
    
    win.document.write('<html><head><title>' + getFileName('ATC_Venues') + '</title>');
    win.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    win.document.write('<link rel="stylesheet" href="/css/venues.css">');
    win.document.write('<style>');
    win.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    win.document.write('th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }');
    win.document.write('th { background: #343a40; color: #fff; font-weight: bold; }');
    win.document.write('@media print { .action-buttons { display: none; } }');
    win.document.write('</style>');
    win.document.write('</head><body>');
    win.document.write('<h2 style="text-align:center; margin: 20px 0;">Venues Management Report</h2>');
    win.document.write(printContents);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  });

  // PDF Download (multi-page support)
  $('#downloadPDF').click(function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    const tableEl = document.getElementById('venuesTableContainer');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    html2canvas(tableEl, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40; // 20px margin on each side
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 20;
      
      // Add first page
      doc.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while(heightLeft > 0) {
        position = heightLeft - imgHeight + 20;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      doc.save(getFileName('ATC_Venues') + '.pdf');
    });
  });
});
