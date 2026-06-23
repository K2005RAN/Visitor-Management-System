import { useRef, useState, useEffect } from "react";
import InputField from "../../components/ui/InputField";
import SelectField from "../../components/ui/SelectField";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { baseURL } from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaSync, FaTrash, FaCheckCircle } from "react-icons/fa";

const GeneratePass = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  const [visitorData, setVisitorData] = useState({
    visitorPhoto: null,
    name: "",
    contactNo: "",
    email: "",
    company: "",
    noOfPeople: 1,
    nationality: "",
    identityType: "",
    identityNo: "",
    address: "",
    country: "",
    state: "",
    city: "",
    vehicleDetails: "",
    allowOn: "",
    allowTill: "",
    departmentTo: "", 
    employeeTo: "",   
    visitType: "",
    token: "",
    specialInstruction: "",
    purposeOfVisit: "",
    createdBy: user?._id,
    ppeInfo: [], 
    safetyInduction: "no"
  });

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [loading, setLoading] = useState(false); 

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. Fetch live backend plant departments database array collection list items on load mount
  useEffect(() => {
    const fetchLiveDepartments = async () => {
      try {
        const res = await axios.get(`${baseURL}department/list`, { withCredentials: true });
        if (res.data.success) {
          const formattedDepts = res.data.data.map((dept) => ({
            label: dept.department_name || dept.name,
            value: dept.department_id || dept.name 
          }));
          setDepartments(formattedDepts);
        }
      } catch (err) {
        console.error("Failed to fetch official factory departments:", err);
      }
    };
    fetchLiveDepartments();
  }, []);

  // 2. Dynamic host listing retrieval dependency sync triggered on department modifications
  useEffect(() => {
    const fetchHostsBySelectedDepartment = async () => {
      if (!visitorData.departmentTo || visitorData.departmentTo.trim() === "") {
        setEmployees([]);
        return;
      }
      try {
        const targetURL = `${baseURL.endsWith('api/v1/') ? baseURL : baseURL + 'api/v1/'}shared/employees?departmentId=${visitorData.departmentTo}`;
        const res = await axios.get(targetURL, { withCredentials: true });
        
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const formattedEmps = res.data.data.map((emp) => ({
            label: `${emp.name} (${emp.designation || "Staff"})`,
            value: emp._id,
            
            // 🟢 MATCHED PROPERTY NAME EXACTLY: Maps to the database response field
            email: emp.employee_email || emp.email || ""
          }));
          setEmployees(formattedEmps);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.error("Failed to sync structural team profiles:", err);
        setEmployees([]);
      }
    };

    fetchHostsBySelectedDepartment();
    
    if (visitorData.departmentTo) {
      setVisitorData((prev) => ({ ...prev, employeeTo: "" }));
    }
  }, [visitorData.departmentTo]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setCapturedPhoto(null);
      }
    } catch (err) {
      toast.error("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    setCapturedPhoto(photoDataUrl);
    setVisitorData((prev) => ({ ...prev, visitorPhoto: photoDataUrl }));
    stopCamera();
    toast.success("Photo Captured");
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVisitorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFetchPreviousData = async () => {
    if (!visitorData.contactNo || visitorData.contactNo.length < 10) {
      toast.error("Enter a valid 10-digit number");
      return;
    }
    try {
      setFetchLoading(true);
      const res = await axios.get(`${baseURL}visitor/fetch-previous-pass`, {
        params: { contactNo: visitorData.contactNo },
      });
      if (res?.data?.success) {
        const d = res.data.data;
        const resolvedAddress = d.company || d.address || d.visitor_company || "";

        setVisitorData((prev) => ({
          ...prev,
          name: d.name || d.visitor_name || d.fullName || "",
          email: d.email || d.visitor_email || "",
          address: resolvedAddress,
          company: resolvedAddress,
          identityType: d.identityType || d.identity_type || "",
          identityNo: d.identityNo || d.identity_no || "",
          nationality: d.nationality || "",
        }));
        toast.success("Details auto-filled");
      }
    } catch (err) {
      toast.error("No history found");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!visitorData.visitorPhoto) return toast.error("Visitor photo is required!");
    if (!visitorData.departmentTo) return toast.error("Please select a target department!");
    if (!visitorData.employeeTo) return toast.error("Please specify the host official to meet!");

    try {
      setLoading(true); 
      const generatedPassId = `MYCEM-${Math.floor(100000 + Math.random() * 900000)}`;
      const cleanLocation = visitorData.company.trim() || visitorData.address.trim() || "OFFICIAL";

      const selectedEmployeeObj = employees.find(emp => {
        return emp.value?.toString().trim() === visitorData.employeeTo?.toString().trim();
      });

      let extractedEmployeeName = "Official Staff";
      if (selectedEmployeeObj && selectedEmployeeObj.label) {
        extractedEmployeeName = selectedEmployeeObj.label.split(" (")[0];
      }

      const selectedDeptObj = departments.find(dept => dept.value?.toString() === visitorData.departmentTo?.toString());
      const extractedDepartmentName = selectedDeptObj ? selectedDeptObj.label : "Operations Desk";

      const submissionData = {
        ...visitorData,
        company: cleanLocation,
        address: cleanLocation,
        passId: generatedPassId,
        identityNo: visitorData.identityType === "aadhar" ? "[Aadhaar Redacted]" : visitorData.identityNo,
        
        employee_name: extractedEmployeeName,
        employee_to_visit: extractedEmployeeName,
        department_name: extractedDepartmentName,
        
        employeeToText: extractedEmployeeName,
        departmentToText: extractedDepartmentName,

        // 🟢 Pack the correct host email text straight from the active dropdown option index
        hostEmail: selectedEmployeeObj?.email || ""
      };

      const postURL = `${baseURL.endsWith('api/v1/') ? baseURL : baseURL + 'api/v1/'}visitor/generate-pass`;
      const res = await axios.post(postURL, submissionData, { withCredentials: true });
      
      if (res.data.success) {
        toast.success("Pass Generated & Host Email Notification Sent!");
        
        navigate(`/visitor-pass-display/${res.data.data.passId}`, {
          state: { 
            passData: {
              ...res.data.data,
              employee_name: extractedEmployeeName,
              employee_to_visit: extractedEmployeeName,
              department_name: extractedDepartmentName
            } 
          }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation Failed");
    } finally {
      // 🟢 CHANGED: Fixed invalid 'declare' statement to standard 'finally'
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Generate <span className="text-lime-500">Visitor Pass</span>
          </h1>
          <p className="text-slate-500 text-sm">Create a secure entry pass for the visitor.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Step 1: Photo & Contact */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-black uppercase text-lime-600 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-[10px]">01</span>
                Photo & Contact
              </h3>

              <div className="flex flex-col items-center mb-6">
                <div className="relative w-full aspect-video bg-slate-100 dark:bg-black rounded-xl overflow-hidden border-2 border-slate-200 dark:border-gray-800 shadow-inner">
                  {!capturedPhoto ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      {!isCameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-gray-900">
                          <FaCamera size={32} className="mb-2 opacity-20" />
                          <p className="text-[10px] font-bold uppercase">Camera Inactive</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <img src={capturedPhoto} className="w-full h-full object-cover" alt="Visitor" />
                  )}
                </div>

                <div className="flex gap-2 -mt-5 z-10">
                  {!isCameraActive && !capturedPhoto ? (
                    <button type="button" onClick={startCamera} className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 hover:bg-black transition-all">
                      <FaCamera /> Open Camera
                    </button>
                  ) : isCameraActive ? (
                    <button type="button" onClick={capturePhoto} className="bg-lime-500 text-white px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 hover:bg-lime-600 animate-pulse">
                      <FaSync /> Capture Photo
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setCapturedPhoto(null); startCamera(); }} className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2 hover:bg-red-600 transition-all">
                      <FaTrash /> Retake
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 items-end">
                  <InputField label="Contact No" name="contactNo" value={visitorData.contactNo} onChange={handleInputChange} placeholder="91XXXXXXXX" />
                  <button type="button" onClick={handleFetchPreviousData} className="bg-slate-800 text-white px-4 h-10 rounded-lg text-xs font-bold hover:bg-black mb-1">
                    {fetchLoading ? "..." : "Fetch"}
                  </button>
                </div>
                <InputField label="Full Name" name="name" value={visitorData.name} onChange={handleInputChange} />
                <InputField label="Email Address" name="email" value={visitorData.email} onChange={handleInputChange} />
              </div>
            </div>

            {/* Step 2: Identity & Purpose */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-black uppercase text-lime-600 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-[10px]">02</span>
                Identity & Purpose
              </h3>
              <div className="space-y-4">
                <InputField label="Company / Organization" name="company" value={visitorData.company} onChange={handleInputChange} />
                <SelectField 
                  label="Identity Proof Type" 
                  name="identityType" 
                  value={visitorData.identityType} 
                  onChange={handleInputChange} 
                  options={[
                    {label: "Aadhar Card", value: "aadhar"}, 
                    {label: "Pan Card", value: "pan"}, 
                    {label: "Driving License", value: "dl"},
                    {label: "Passport", value: "passport"}
                  ]} 
                />
                <InputField label="Identity Number" name="identityNo" value={visitorData.identityNo} onChange={handleInputChange} />
                <InputField label="Purpose of Visit" name="purposeOfVisit" value={visitorData.purposeOfVisit} onChange={handleInputChange} />
                
                <SelectField 
                  label="Safety Induction Completed?" 
                  name="safetyInduction" 
                  value={visitorData.safetyInduction || "no"} 
                  onChange={handleInputChange} 
                  options={[
                    {label: "Yes", value: "yes"}, 
                    {label: "No", value: "no"}
                  ]} 
                />
              </div>
            </div>

            {/* Step 3: Host & PPE Info */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-black uppercase text-lime-600 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-[10px]">03</span>
                 Host & PPE info
              </h3>
              <div className="space-y-4">
                
                <SelectField 
                  label="Target Department" 
                  name="departmentTo" 
                  value={visitorData.departmentTo || ""} 
                  options={departments} 
                  onChange={handleInputChange}
                />

                <SelectField 
                  label="Person to Meet" 
                  name="employeeTo" 
                  value={visitorData.employeeTo || ""} 
                  options={employees} 
                  onChange={handleInputChange}
                  disabled={!visitorData.departmentTo || visitorData.departmentTo.trim() === ""}
                />
                
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                      PPE Issued
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Safety Helmet", id: "helmet" },
                      { label: "Safety Goggles", id: "goggles" },
                      { label: "Safety Shoes", id: "shoes" },
                      { label: "Reflective Jacket", id: "jacket" }
                    ].map((item) => (
                      <label 
                        key={item.id} 
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors select-none"
                      >
                        <input
                          type="checkbox"
                          name="ppe_info"
                          value={item.id}
                          checked={visitorData.ppeInfo?.includes(item.id) || false}
                          onChange={(e) => {
                            const { checked, value } = e.target;
                            const currentPpe = visitorData.ppeInfo || [];
                            
                            const updatedPpe = checked 
                              ? [...currentPpe, value] 
                              : currentPpe.filter(id => id !== value);

                            handleInputChange({
                              target: {
                                name: "ppeInfo",
                                value: updatedPpe
                              }
                            });
                          }}
                          className="w-4 h-4 rounded text-lime-600 border-slate-300 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <button 
              type="submit" 
              disabled={loading} 
              className="group bg-lime-500 hover:bg-lime-600 text-white px-12 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-lime-500/20 transition-all flex items-center gap-3 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  Processing <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                <>
                  Generate Pass <FaCheckCircle className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default GeneratePass;