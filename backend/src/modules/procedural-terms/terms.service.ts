export interface TermCalculationRequest {
  notifiedDate: string; // YYYY-MM-DD
  termInDays: number; // Ej: 3 días (Apelación), 10 días (Contestación ordinaria), 10 días (Tutela)
  jurisdictionType: 'LABORAL' | 'CIVIL' | 'CONSTITUCIONAL' | 'ADMINISTRATIVO';
  firmId: string;
}

export interface TermCalculationResult {
  notifiedDate: string;
  startDate: string; // Día siguiente al de la notificación (Art. 118 CGP)
  dueDate: string;   // Fecha límite de vencimiento a las 5:00 PM
  dueTime: string;
  totalBusinessDays: number;
  excludedDays: {
    date: string;
    reason: string;
  }[];
  normativeReference: string;
}

export class ProceduralTermsService {
  /**
   * Calcula el término procesal en días hábiles conforme al Art. 118 del CGP y Art. 151 CPTSS
   */
  public calculateJudicialTerm(req: TermCalculationRequest): TermCalculationResult {
    const startDate = new Date(req.notifiedDate);
    let currentDate = new Date(startDate);

    // En Colombia el término empieza a correr al día siguiente de la notificación (Art. 118 CGP)
    currentDate.setDate(currentDate.getDate() + 1);
    const calculatedStartDate = currentDate.toISOString().split('T')[0];

    let businessDaysCounted = 0;
    const excludedDays: { date: string; reason: string }[] = [];

    // Festivos oficiales y suspensiones judiciales en Colombia 2026
    const holidays2026 = [
      '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
      '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-07-20',
      '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16',
      '2026-12-08', '2026-12-25'
    ];

    while (businessDaysCounted < req.termInDays) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0: Dom, 6: Sáb

      if (dayOfWeek === 0) {
        excludedDays.push({ date: dateStr, reason: 'Domingo (Día no hábil)' });
      } else if (dayOfWeek === 6) {
        excludedDays.push({ date: dateStr, reason: 'Sábado (Día no hábil judicial)' });
      } else if (holidays2026.includes(dateStr)) {
        excludedDays.push({ date: dateStr, reason: 'Festivo Oficial en Colombia' });
      } else {
        businessDaysCounted++;
      }

      if (businessDaysCounted < req.termInDays) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const dueDateStr = currentDate.toISOString().split('T')[0];

    return {
      notifiedDate: req.notifiedDate,
      startDate: calculatedStartDate,
      dueDate: dueDateStr,
      dueTime: '17:00 (5:00 PM - Cierre de Barandilla Virtual)',
      totalBusinessDays: req.termInDays,
      excludedDays,
      normativeReference: req.jurisdictionType === 'LABORAL'
        ? 'Art. 118 Código General del Proceso (CGP) & Art. 151 CPTSS'
        : 'Art. 118 Código General del Proceso & Decreto 806 / Ley 2213'
    };
  }
}
