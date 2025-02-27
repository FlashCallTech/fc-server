'use client';

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

const FileUpload: React.FC = () => {
    const [fileError, setFileError] = useState<string | null>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState("Active Clients");
    const [fileName, setFileName] = useState<string | null>(null); // Store file name

    const onDrop = (acceptedFiles: File[]) => {
        setFileError(null);
        setFileName(null); // Reset previous file name

        const file = acceptedFiles[0];
        if (!file) {
            setFileError("No file selected.");
            return;
        }

        setFileName(file.name); // Save file name

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

            if (!validateData(jsonData)) {
                return;
            }

            setContacts(jsonData);
            console.log("Uploaded Contacts:", jsonData);
        };

        reader.readAsArrayBuffer(file);
    };


    const validateData = (data: any[]) => {
        if (data.length === 0) {
            setFileError("File is empty.");
            return false;
        }

        const requiredColumns = ["first_name", "phone"];
        const headers = Object.keys(data[0]);

        if (!requiredColumns.every((col) => headers.includes(col))) {
            setFileError("Missing required columns: Name, Phone Number.");
            return false;
        }

        for (const contact of data) {
            if (!/^\+\d{1,3}\s?\d+$/.test(contact["phone"])) {
                setFileError(
                    "Invalid phone number format. It must include a country code."
                );
                return false;
            }
        }

        return true;
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                ".xlsx",
            ],
        },
    });

    return (
        <div className="p-8">
            <div className="p-6 border rounded-lg size-full mx-auto">
                <h2 className="text-lg font-semibold mb-4">Import Contacts</h2>

                {/* Upload File Section */}
                <div className="p-6 border rounded-lg">
                    <div
                        {...getRootProps()}
                        className="border-dashed border-2 rounded-lg py-6 px-4 text-center cursor-pointer"
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center text-[#6B7280]">
                            {/* Show uploaded file name inside the dropzone */}
                            {fileName ? (
                                <span className="text-sm font-medium text-gray-700">
                                    📄 {fileName}
                                </span>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-[#6B7280]">
                                    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="37.5" height="30" viewBox="0 0 37.5 30"><defs><clipPath id="master_svg0_142_04635"><rect x="0" y="0" width="37.5" height="30" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_04635)"><g transform="matrix(1,0,0,-1,0,57.5390625)"><g><path d="M8.4375,28.76953125Q4.86328,28.88671925,2.46094,31.23047125Q0.117188,33.63281125,0,37.20703125Q0.0585938,40.01953125,1.58203,42.12893125Q3.10547,44.23833125,5.625,45.17573125Q5.625,45.41013125,5.625,45.64453125Q5.74219,49.62893125,8.37891,52.26563125Q11.0156,54.90233125,15,55.01953125Q17.6367,54.96093125,19.7461,53.730431249999995Q21.8555,52.44143125,23.1445,50.33203125Q24.4922,51.26953125,26.25,51.26953125Q28.6523,51.21093125,30.2344,49.62893125Q31.8164,48.04683125,31.875,45.64453125Q31.875,44.58983125,31.5234,43.59373125Q34.1016,43.06643125,35.8008,41.01563125Q37.4414,39.02343125,37.5,36.26953125Q37.4414,33.10547125,35.332,30.93750125Q33.1641,28.82812505,30,28.76953125L8.4375,28.76953125ZM13.0664,41.48433125Q12.2461,40.48833125,13.0664,39.49223125Q14.0625,38.67187125,15.0586,39.49223125L17.3438,41.77733125L17.3438,33.92578125Q17.4609,32.63672125,18.75,32.51953125Q20.0391,32.63672125,20.1562,33.92578125L20.1562,41.77733125L22.4414,39.49223125Q23.4375,38.67187125,24.4336,39.49223125Q25.2539,40.48833125,24.4336,41.48433125L19.7461,46.17183125Q18.75,46.99223125,17.7539,46.17183125L13.0664,41.48433125Z" fill="#9CA3AF" fill-opacity="1" /></g></g></g></svg>
                                    <span className="text-sm mt-3">Click to upload or drag and drop</span>
                                    <span className="text-xs">CSV, XLS, or XLSX files</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File Requirements */}
                    <div className="mt-4 p-4 rounded-md text-[#6B7280]">
                        <h3 className="font-semibold">File Format Requirements:</h3>
                        <ul className="text-sm list-disc pl-4 mt-2">
                            <li>File must be in CSV, XLS, or XLSX format</li>
                            <li>First row should contain column headers</li>
                            <li>Required columns: Name, Phone Number</li>
                            <li>Phone numbers should include country code</li>
                        </ul>
                        <button className="mt-6 flex gap-2 border rounded-full px-4 py-2 text-sm font-medium text-[#6B7280]">
                            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="14" height="14" viewBox="0 0 14 14"><defs><clipPath id="master_svg0_142_04630"><rect x="0" y="0" width="14" height="14" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_142_04630)"><g transform="matrix(1,0,0,-1,0,28.6015625)"><g><path d="M7.875,27.42578125Q7.875,27.80858125,7.62891,28.05468125Q7.38281,28.30078125,7,28.30078125Q6.61719,28.30078125,6.37109,28.05468125Q6.125,27.80858125,6.125,27.42578125L6.125,20.78125125L4.12891,22.804691249999998Q3.85547,23.05078125,3.5,23.05078125Q3.14453,23.05078125,2.87109,22.804691249999998Q2.625,22.53125125,2.625,22.17578125Q2.625,21.82031125,2.87109,21.54687125L6.37109,18.04687125Q6.64453,17.80078125,7,17.80078125Q7.35547,17.80078125,7.62891,18.04687125L11.1289,21.54687125Q11.375,21.82031125,11.375,22.17578125Q11.375,22.53125125,11.1289,22.804691249999998Q10.8555,23.05078125,10.5,23.05078125Q10.1445,23.05078125,9.87109,22.804691249999998L7.875,20.78125125L7.875,27.42578125ZM1.75,18.67578125Q1.01172,18.64844125,0.519531,18.15625125Q0.0273438,17.66406125,0,16.92578125L0,16.05078125Q0.0273438,15.31250125,0.519531,14.82031225Q1.01172,14.32812505,1.75,14.30078125L12.25,14.30078125Q12.9883,14.32812505,13.4805,14.82031225Q13.9727,15.31250125,14,16.05078125L14,16.92578125Q13.9727,17.66406125,13.4805,18.15625125Q12.9883,18.64844125,12.25,18.67578125L9.48828,18.67578125L8.23047,17.44531125Q7.68359,16.92578125,7,16.92578125Q6.28906,16.92578125,5.76953,17.44531125L4.53906,18.67578125L1.75,18.67578125ZM11.8125,17.14453125Q12.4141,17.08984125,12.4688,16.48828125Q12.4141,15.88672125,11.8125,15.83203125Q11.2109,15.88672125,11.1562,16.48828125Q11.2109,17.08984125,11.8125,17.14453125Z" fill="#374151" fill-opacity="1" /></g></g></g></svg>
                            <span>
                                Download Sample CSV Template
                            </span>
                        </button>
                    </div>

                    {/* Select Group Dropdown */}
                    <div className="mt-4">
                        <label className="text-sm font-semibold text-[#6B7280]">Select Group</label>
                        <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full mt-1 border rounded-lg p-2 bg-white"
                        >
                            <option value="Active Clients">Active Clients</option>
                            <option value="Leads">Leads</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Error Message */}
                    {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}

                    {/* Buttons */}
                    <div className="mt-6 flex justify-end gap-4 text-sm">
                        <button className="py-2 px-4 border rounded-full text-gray-700">
                            Cancel
                        </button>
                        <button className="py-2 px-4 bg-black text-white rounded-full hover:opacity-90">
                            Import Contacts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
