// Subjects Page JavaScript
$(document).ready(function() {
  // Select2 is already initialized in footer.ejs

  // Generate file name with timestamp
  function getFileName(type) {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}`;
    return `Subjects_${timestamp}.${type}`;
  }

  // CSV Download
  $('#csvDownloadBtn').click(function() {
    let csv = 'user_email,subject_code,program_code,total_hours_per_week,semester,type_prac_or_theory\n';
    
    $('#subjectTable tbody tr').each(function() {
      const email = $(this).find('td:eq(0)').text().match(/Email:\s*([^\n<]+)/)?.[1]?.trim() || '';
      const subj_code = $(this).find('td:eq(1)').text().match(/Code:\s*([^\n<]+)/)?.[1]?.trim() || '';
      const program_code = $(this).find('td:eq(2)').text().match(/Code:\s*([^\n<]+)/)?.[1]?.trim() || '';
      const total_hours = $(this).find('td:eq(1)').text().match(/LTPA:\s*(\d+)/)?.[1] || '';
      const semester = $(this).find('td:eq(1)').text().match(/Semester:\s*([^\n<]+)/)?.[1]?.trim() || '';
      const type_prac_or_theory = $(this).find('td:eq(1)').text().match(/Type:\s*([^\n<]+)/)?.[1]?.trim() || '';

      let row = [email, subj_code, program_code, total_hours, semester, type_prac_or_theory];
      csv += row.map(e => `"${e}"`).join(',') + '\n';
    });

    const csvFile = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(csvFile);
    a.download = getFileName('csv');
    a.click();
  });

  // Print Functionality
  $('#printBtn').click(function() {
    const content = document.getElementById('subjectTableContainer').innerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Subjects Print</title>');
    win.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    win.document.write('<link rel="stylesheet" href="/css/subjects.css">');
    win.document.write('</head><body>');
    win.document.write('<div class="container mt-4">');
    win.document.write('<h2 class="text-center mb-4">Subjects Assignment Report</h2>');
    win.document.write(content);
    win.document.write('</div></body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  });

  // PDF Export
  $('#pdfDownloadBtn').click(function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    const table = document.getElementById('subjectTableContainer');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    html2canvas(table, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
      let heightLeft = pdfHeight;
      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, pageWidth, pdfHeight);
      heightLeft -= pageHeight;

      while(heightLeft > 0) {
        position = heightLeft - pdfHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, pageWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      doc.save(getFileName('pdf'));
    });
  });

  // Show success alert if present
  if ($('#successAlert').length && !$('#successAlert').hasClass('d-none')) {
    setTimeout(() => {
      $('#successAlert').fadeOut();
    }, 3000);
  }
});
