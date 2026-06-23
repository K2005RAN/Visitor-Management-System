import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { baseURL } from "../../assets/assets";
import { 
  FaUser, FaShieldAlt, FaPhone, FaBuilding, FaUserTie, 
  FaCheckCircle, FaExclamationTriangle, FaVideoSlash, FaSmokingBan 
} from "react-icons/fa";

const VisitorPassDisplay = () => {
  const { passId } = useParams();
  const location = useLocation();
  const [passDetails, setPassDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "MYCEM PASS";
    return () => {
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    const fetchPassDetails = async () => {
      if (location.state?.passData) {
        const historyData = location.state.passData;
        try {
          const fallbackPassId = historyData.passId || historyData.pass_id || passId;
          const rawStateCompany = historyData.company || historyData.address || historyData.visitor_company || "";
          const resolvedStateCompany = rawStateCompany.trim() !== "" ? rawStateCompany.trim() : "N/A";
          
          const cleanStateEmpName = historyData.employee_name || historyData.employee_to_visit || historyData.employeeToText || historyData.employeeTo || "N/A";
          const cleanStateDeptName = historyData.department_name || historyData.departmentToText || historyData.departmentTo || "N/A";

          const mappedData = {
            ...historyData,
            passId: fallbackPassId,
            visitor_name: historyData.name || historyData.visitor_name || "N/A",
            visitor_contact_no: historyData.contactNo || historyData.contact_no || historyData.visitor_contact_no || "N/A",
            company: resolvedStateCompany,
            purpose_of_visit: historyData.purposeOfVisit || historyData.purpose_of_visit || "OFFICIAL",
            allow_on: historyData.allowOn || historyData.allow_on,
            visitor_photo: historyData.visitorPhoto || historyData.visitor_photo,
            department_name: cleanStateDeptName,
            employee_name: cleanStateEmpName, 
            safety_induction: historyData.safety_induction || historyData.safetyInduction || "no",
            ppe_info: historyData.ppe_info || historyData.ppeInfo || []
          };
          const qrDataUrl = await QRCode.toDataURL(mappedData.passId);
          setPassDetails({ ...mappedData, qrCode: qrDataUrl });
          setLoading(false);
          return;
        } catch (qrErr) {
          console.error("QR Generation Error:", qrErr);
        }
      }
      try {
        const res = await axios.get(`${baseURL}visitor/pass-details/${passId}`, { withCredentials: true });
        if (res?.data?.success) {
          const data = res.data.data;
          const qrDataUrl = await QRCode.toDataURL(passId);
          const rawDbCompany = data.company || data.address || data.visitor_company || "";
          const resolvedDbCompany = rawDbCompany.trim() !== "" ? rawDbCompany.trim() : "N/A";
          
          const cleanDbEmpName = data.employee_name || data.employee_to_visit || data.employeeToText || data.employeeTo || "N/A";
          const cleanDbDeptName = data.department_name || data.departmentToText || data.departmentTo || "N/A";

          setPassDetails({
            ...data, 
            qrCode: qrDataUrl,
            visitor_name: data.name || data.visitor_name || "N/A",
            visitor_contact_no: data.contactNo || data.contact_no || data.visitor_contact_no || "N/A",
            company: resolvedDbCompany,
            purpose_of_visit: data.purposeOfVisit || data.purpose_of_visit || "OFFICIAL",
            allow_on: data.allowOn || data.allow_on,
            visitor_photo: data.visitorPhoto || data.visitor_photo,
            department_name: cleanDbDeptName,
            employee_name: cleanDbEmpName, 
            safety_induction: data.safety_induction || "no",
            ppe_info: data.ppe_info || []
          });
        }
      } catch (error) {
        toast.error("Pass verification details missing");
      } finally {
        loading && setLoading(false);
      }
    };
    if (passId) fetchPassDetails();
  }, [passId, location.state]);

  const handlePrint = () => window.print();

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime()) || date.getTime() === 0) return "N/A";
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    return `${day}-${month}-${year} | ${strTime}`;
  };

  const safetyDone = passDetails?.safety_induction === "yes";

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 md:p-6 flex flex-col items-center print-wrapper-reset text-slate-800 antialiased font-sans">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800;900&display=swap');
        
        body, .font-sans {
          font-family: 'Public Sans', -apple-system, sans-serif !important;
        }

        @media print {
          @page { 
            margin: 0; 
            size: 210mm 148mm landscape; 
          }

          html, body {
            background: #fff !important;
            margin: 0 !important; 
            padding: 0 !important;
            width: 210mm !important; 
            height: 148mm !important;
            overflow: hidden !important;
          }

          .print-wrapper-reset { 
            padding: 0 !important; 
            background: transparent !important; 
            display: block !important; 
          }
          
          body * { 
            visibility: hidden !important; 
          }
          
          .vp-card, .vp-card * { 
            visibility: visible !important; 
          }
          
          .vp-card {
            position: absolute !important;
            left: 4mm !important; 
            top: 4mm !important;
            width: 202mm !important; 
            height: 140mm !important;
            margin: 0 !important; 
            box-shadow: none !important; 
            border-radius: 12px !important;
            border: 3px solid #0a111e !important;
            background: #ffffff !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          .no-print { 
            display: none !important; 
          }
          
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        }
      `}</style>

      {/* Main Container Card Frame */}
      <div className="vp-card w-full max-w-[840px] h-[520px] bg-white flex flex-col rounded-xl overflow-hidden border border-slate-200 relative select-none"
        style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.07)" }}>

        {/* Diagonal Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <span className="text-[140px] font-black tracking-[0.2em] uppercase text-slate-100/70 dark:text-slate-900/5 -rotate-[20deg] whitespace-nowrap">
            VERIFIED
          </span>
        </div>

        {/* Brand Header Row Block */}
        <div className="flex justify-between items-center px-6 py-2.5 relative bg-[#0a111e] border-b border-slate-800 z-10">
          <div className="flex items-center gap-6">
            
            {/* Logo Layout Engine Block */}
            <div className="flex flex-col pt-1">
              <h1 className="text-[25px] font-black tracking-tighter leading-none uppercase">
                <span className="text-[#00b074]">HEIDELBERG</span>
                <span className="text-white">CEMENT</span>
              </h1>
              <span className="text-[10px] font-extrabold tracking-[0.16em] text-[#94a3b8] uppercase self-end mt-0.5 mr-0.5">
                INDIA
              </span>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-wider">
                <FaVideoSlash size={12} className="text-slate-400" />
                <span>Photography Prohibited</span>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-wider">
                <FaSmokingBan size={12} className="text-slate-400" />
                <span>Smoking Prohibited</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#1e293b] border border-slate-700 text-white px-4 py-1 rounded-lg text-center min-w-[140px]">
              <p className="text-[7.5px] font-black text-[#00b074] uppercase tracking-widest mb-0.5">★ ENTRY ID ★</p>
              <p className="text-[13px] font-mono font-black text-white tracking-wider">{passDetails?.passId || passId}</p>
            </div>
            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <img src={passDetails?.qrCode} alt="Verification Matrix" className="w-9 h-9 block" />
            </div>
          </div>
        </div>

        {/* Status Access Ribbon */}
        <div className="bg-[#00b074] text-white py-1 px-6 flex justify-between items-center font-extrabold text-[10px] uppercase tracking-[0.2em] z-10 shadow-sm">
          <span>🛡️ Official Visitor Pass</span>
          <span className="text-white bg-black/10 px-2 py-0.5 rounded text-[9px]">✓ Verified Document</span>
        </div>

        {/* Dashboard Content Matrix */}
        <div className="flex flex-row flex-1 items-stretch bg-transparent overflow-hidden">
          
          {/* Column Flank A: Profile Avatar Box */}
          <div className="w-[185px] bg-slate-50/50 border-r border-slate-100 flex flex-col items-center justify-start p-5 flex-shrink-0">
            <div className="w-[135px] h-[160px] bg-white border-2 border-slate-200 p-1.5 rounded-xl shadow-sm relative">
              <div className="w-full h-full rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                {passDetails?.visitor_photo ? (
                  <img src={passDetails.visitor_photo} alt="Visitor Portrait" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                    <FaUser size={38} className="text-slate-200" />
                    <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">No Portrait</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-[135px] mt-3 bg-[#00b074] text-white rounded-lg py-1.5 text-center font-black text-[11px] tracking-[0.25em] uppercase shadow-sm">
              VISITOR
            </div>
          </div>

          {/* Column Flank B: Identity Meta-Data Attributes */}
          <div className="flex-1 flex flex-col justify-between p-5 pr-6 border-r border-slate-100">
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[9px] font-black text-[#00b074] uppercase tracking-widest block mb-0.5">Visitor Name</span>
                <h2 className="text-[24px] font-black text-slate-900 uppercase tracking-tight leading-none">
                  {passDetails?.visitor_name}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 mt-2">
                <FieldRow label="Person to Meet" value={passDetails?.employee_name} icon={<FaUserTie className="text-[#00b074]" size={11} />} />
                <FieldRow label="Department" value={passDetails?.department_name} icon={<FaBuilding className="text-[#00b074]" size={11} />} />
                <FieldRow label="Company / Address" value={passDetails?.company} icon={<FaBuilding className="text-[#00b074]" size={11} />} />
                <FieldRow label="Contact Number" value={passDetails?.visitor_contact_no} icon={<FaPhone className="text-[#00b074]" size={11} />} />
              </div>

              <div className="mt-1 border-t border-slate-100 pt-2.5">
                <FieldRow label="Purpose of Visit" value={passDetails?.purpose_of_visit} />
              </div>
            </div>

            {/* 🕒 TIME WRAPPER SECTIONS FIXED TO PREVENT HALF-LINE TEXT CLIPPING */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-[#00b074] border border-emerald-100 flex-shrink-0">
                  <FaCheckCircle size={15} />
                </div>
                <div className="overflow-visible min-h-[34px] flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">Entry Date & Time</p>
                  <p className="text-[11px] font-bold text-slate-800 tracking-tight" style={{ lineHeight: "1.2" }}>
                    {formatDate(passDetails?.allow_on)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex-shrink-0">
                  <FaExclamationTriangle size={15} />
                </div>
                <div className="flex-1 overflow-visible min-h-[34px] flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Exit Date & Time</p>
                  <div className="border-b-2 border-slate-300 border-dotted w-full mt-2.5"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Column Flank C: Safety & Induction Parameters */}
          <div className="w-[245px] bg-slate-50/20 p-5 flex flex-col justify-between flex-shrink-0">
            <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Safety Induction</p>
              <div className="flex justify-center items-center gap-2 bg-slate-50 py-2.5 px-4 rounded-lg border border-slate-100">
                <FaShieldAlt size={16} className={safetyDone ? "text-[#00b074]" : "text-amber-500"} />
                <span className={`text-[12px] font-black uppercase tracking-wider ${safetyDone ? "text-[#00b074]" : "text-amber-600"}`}>
                  {safetyDone ? "✓ Completed" : "✗ Pending"}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex-1 my-3 flex flex-col">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">PPE Equipment Issued</p>
              <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[85px] pr-1 mt-1">
                {passDetails?.ppe_info && passDetails.ppe_info.length > 0 ? (
                  passDetails.ppe_info.map((item) => (
                    <span key={item} className="bg-[#0f172a] text-white text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-wider border border-slate-800 shadow-sm flex items-center gap-1">
                      🛡️ {item}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide bg-amber-50 px-2.5 py-1 rounded border border-amber-100 mt-1">
                    None Specified
                  </span>
                )}
              </div>
            </div>

            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider space-y-1 bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
              <p><span className="text-slate-500">Pass Type :</span> Official Visitor</p>
              <p><span className="text-slate-500">Issued By :</span> MYCEM Visitor System</p>
              <p className="leading-tight"><span className="text-slate-500">Location :</span> Village & PO Narsingarh, Dist. Damoh (MP), 470675</p>
            </div>
          </div>
        </div>

        {/* Verification Signatures Layout Row */}
        <div className="sg-row px-6 pb-3 z-10 grid grid-cols-3 gap-6 bg-white border-t border-slate-100 pt-1">
          <SignBlock label="Security Guard Signature" />
          <SignBlock label="Visitor Signature" />
          <SignBlock label="Authorized Plant Authority" />
        </div>

        {/* Absolute Bottom Guidelines & Compliance Bands */}
        <div className="flex flex-col z-10 mt-auto">
          <div className="bg-amber-50 border-t border-b border-amber-200/60 px-6 py-2 text-center text-[9px] font-black text-amber-800 tracking-wide uppercase flex items-center justify-center gap-2 select-none">
            <FaExclamationTriangle size={11} className="text-amber-600" />
            Please return this pass ledger slip to the security gate checkpoint terminal office upon exiting the premises.
          </div>
          <div className="bg-[#0a111e] py-2 text-center text-[8px] font-bold text-slate-500 tracking-[0.22em] uppercase flex justify-center items-center gap-6 border-t border-slate-800 select-none">
            <span>Website: www.mycemco.com</span>
            <span>•</span>
            <span>PROPERTY OF HEIDELBERGCEMENT • PHOTOGRAPHY & SMOKING PROHIBITED</span>
          </div>
        </div>
      </div>

      {/* Control UI Operations Dash */}
      <div className="mt-6 no-print text-center flex flex-col items-center gap-1">
        <button
          onClick={handlePrint}
          className="bg-[#006837] hover:bg-[#00502a] text-white font-black text-xs uppercase tracking-[0.16em] px-12 py-3.5 rounded-xl shadow-md shadow-emerald-900/10 transition-all active:scale-[0.98] flex items-center gap-2 border border-emerald-800"
        >
          ✓ Print  Pass
        </button>
        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">
         Genrated by HeidelbergCement Visitor Pass System 
        </p>
      </div>
    </div>
  );
};

const FieldRow = ({ label, value, icon }) => (
  <div className="flex flex-col justify-start">
    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1 select-none">
      {icon}{label}
    </span>
    <span className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wide leading-tight">
      {value || "N/A"}
    </span>
  </div>
);

const SignBlock = ({ label }) => (
  <div className="flex flex-col items-center justify-end h-[42px] bg-transparent">
    <div className="w-full border-b border-slate-200 border-dashed mb-1.5"></div>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider text-center select-none leading-none">
      {label}
    </span>
  </div>
);

export default VisitorPassDisplay;