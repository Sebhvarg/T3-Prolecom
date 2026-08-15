import { useRef } from 'react';
import { Printer, X, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import logo from '../../assets/Logo/logoHorizontal.webp';

const getCodigoValidacion = (titulo = '', length = 0) => {
  let hash = 0;
  const str = `${titulo}-${length}`;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 100000 + Math.abs(hash % 900000);
};

const ModalVisorReportePDF = ({ isOpen, onClose, tituloReporte, filtroSeleccionado, data, headers, onExportCsv }) => {
  const printRef = useRef(null);
  const codigoValidacion = getCodigoValidacion(tituloReporte, data?.length);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tituloReporte} - PROLECOM PDF</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              margin: 0;
              padding: 24px;
            }
            .header-banner {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f2027;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .logo {
              height: 42px;
            }
            .report-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f2027;
              margin: 0 0 4px 0;
            }
            .report-subtitle {
              font-size: 12px;
              color: #64748b;
              margin: 0;
            }
            .filter-badge {
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 11px;
            }
            th {
              background-color: #0f2027;
              color: #ffffff;
              text-transform: uppercase;
              font-size: 10px;
              font-weight: 700;
              padding: 10px 12px;
              text-align: left;
              border: 1px solid #1e3a47;
            }
            td {
              padding: 9px 12px;
              border-bottom: 1px solid #e2e8f0;
              color: #334155;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .footer-sign {
              margin-top: 40px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #94a3b8;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Toolbar */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">Visor de Reporte PDF Oficial</h3>
          </div>

          <div className="flex items-center gap-2">
            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                <span>Exportar CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir / Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white" ref={printRef}>
          {/* Document Header */}
          <div className="header-banner flex justify-between items-start border-b-2 border-[#0f2027] pb-4 mb-6">
            <div>
              <img src={logo} alt="PROLECOM" className="h-10 w-auto object-contain mb-2" />
              <h1 className="text-xl font-extrabold text-[#0f2027] tracking-tight">{tituloReporte}</h1>
              <p className="text-xs text-slate-500 font-medium">Plataforma Académica de Aprendizaje Prolecom - Equipo T3</p>
            </div>

            <div className="text-right text-xs text-slate-500 font-medium">
              <p><strong className="text-slate-800 font-bold">Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <p><strong className="text-slate-800 font-bold">Estado:</strong> Oficial / Auditado</p>
              <p><strong className="text-slate-800 font-bold">Registros:</strong> {data.length}</p>
            </div>
          </div>

          {/* Filter Badge */}
          {filtroSeleccionado && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-700 font-medium mb-5">
              <strong>Criterio de Selección:</strong> {filtroSeleccionado}
            </div>
          )}

          {/* Data Table */}
          {data.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No existen registros en la base de datos que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f2027] text-white">
                    {headers.map((h, index) => (
                      <th key={`hdr-${h}-${index}`} className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider border border-[#1e3a47]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rIdx) => (
                    <tr key={`row-${row.idUsuario || row.idCurso || rIdx}`} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={`cell-${row.idUsuario || rIdx}-${cIdx}`} className="py-2.5 px-3 border-b border-slate-200/80 text-slate-800 font-normal">
                          {val ?? 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Official Stamp */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>PROLECOM LMS © {new Date().getFullYear()} — Reporte Certificado a Nivel de BD</span>
            <span>Código de Validación: PRO-REP-{codigoValidacion}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVisorReportePDF;
