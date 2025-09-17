"use client";
import { apiGetIncomeList } from "@/api/income";
import { apiStartMaterialTask } from "@/api/material";
import { IncomeRecord } from "@/api/types/income";
import { useState } from "react";

export const DemoContent = () => {
  const [result, setResult] = useState<IncomeRecord[]>([]);

  async function startMaterialTask() {
    const res = await apiStartMaterialTask("68c93aafc4be3637b6efde96")
    console.log('----- res', res);
  }


  return (
    <div>
      <div>
        <button onClick={startMaterialTask}>生成</button>

      </div>
    </div>
  );
};
