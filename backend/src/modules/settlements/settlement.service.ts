export interface LaborSettlementRequest {
  monthlySalary: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  terminationType: 'INJUSTA_CAUSA' | 'MUTUO_ACUERDO' | 'JUSTA_CAUSA';
  firmId: string;
}

export interface LaborSettlementResult {
  daysWorked: number;
  severanceIndemnification: number; // Art. 64 CST
  cesantias: number;                // Art. 249 CST
  interesesCesantias: number;       // 12% anual
  primaServicios: number;           // Art. 306 CST
  vacaciones: number;               // Art. 186 CST
  totalSettlement: number;
  agenciasEnDerechoEstimadas: number; // Tarifa CSJ
}

export class SettlementService {
  /**
   * Calcula la liquidación de acreencias laborales e indemnización por despido según la legislación colombiana (CST)
   */
  public calculateLaborSettlement(req: LaborSettlementRequest): LaborSettlementResult {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysWorked = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dailySalary = req.monthlySalary / 30;

    // 1. Cesantías (Salario * días / 360)
    const cesantias = (req.monthlySalary * daysWorked) / 360;

    // 2. Intereses a las cesantías (Cesantías * días * 0.12 / 360)
    const interesesCesantias = (cesantias * daysWorked * 0.12) / 360;

    // 3. Prima de servicios (Salario * días semestre / 360)
    const primaServicios = (req.monthlySalary * (daysWorked % 180 || 180)) / 360;

    // 4. Vacaciones (Salario * días / 720)
    const vacaciones = (req.monthlySalary * daysWorked) / 720;

    // 5. Indemnización por despido sin justa causa (Art. 64 CST)
    let severanceIndemnification = 0;
    if (req.terminationType === 'INJUSTA_CAUSA') {
      if (daysWorked <= 360) {
        severanceIndemnification = 30 * dailySalary;
      } else {
        const extraYears = Math.ceil((daysWorked - 360) / 360);
        severanceIndemnification = (30 * dailySalary) + (extraYears * 20 * dailySalary);
      }
    }

    const totalSettlement = cesantias + interesesCesantias + primaServicios + vacaciones + severanceIndemnification;

    // Agencias en Derecho estimadas (Tarifas CSJ: 5% al 15% de las pretensiones)
    const agenciasEnDerechoEstimadas = totalSettlement * 0.10;

    return {
      daysWorked,
      severanceIndemnification: Math.round(severanceIndemnification),
      cesantias: Math.round(cesantias),
      interesesCesantias: Math.round(interesesCesantias),
      primaServicios: Math.round(primaServicios),
      vacaciones: Math.round(vacaciones),
      totalSettlement: Math.round(totalSettlement),
      agenciasEnDerechoEstimadas: Math.round(agenciasEnDerechoEstimadas)
    };
  }
}
