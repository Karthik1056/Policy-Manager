"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const steps = ["Attributes", "Tabs", "Sub-Tabs", "Fields", "Documents", "Review"];

export default function Stepper() {
  const activeStep = useSelector((state: RootState) => state.policy.activeStep);

  return (
    <div className="flex items-center justify-between w-full mb-8 px-4">
      {steps.map((label, index) => (
        <div key={label} className="flex flex-col items-center flex-1 relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
            ${activeStep > index + 1 ? "bg-green-500 border-green-500 text-white" : 
              activeStep === index + 1 ? "bg-blue-600 border-blue-600 text-white" : 
              "bg-white border-gray-300 text-gray-400"}`}>
            {activeStep > index + 1 ? "✓" : index + 1}
          </div>
          <span className={`text-xs mt-2 font-medium ${activeStep === index + 1 ? "text-blue-600" : "text-gray-500"}`}>
            {label}
          </span>
          {index < steps.length - 1 && (
            <div className={`absolute top-4 left-[60%] w-[80%] h-0.5 -z-10 
              ${activeStep > index + 1 ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}