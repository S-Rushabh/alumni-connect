import React, { useMemo } from 'react';

interface CalendarData {
    date: string; // YYYY-MM-DD
    value: number;
}

interface DonationCalendarHeatmapProps {
    data: CalendarData[];
    className?: string;
}

export const DonationCalendarHeatmap: React.FC<DonationCalendarHeatmapProps> = ({ data, className = '' }) => {
    // Generate last 365 days
    const calendarGrid = useMemo(() => {
        const grid: { date: string; value: number }[] = [];
        const today = new Date();
        const dataMap = new Map(data.map(d => [d.date, d.value]));

        // Include today
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            grid.push({
                date: dateStr,
                value: dataMap.get(dateStr) || 0
            });
        }
        return grid;
    }, [data]);

    // Group by weeks for SVG rendering
    const weeks = useMemo(() => {
        const finalWeeks: { date: string; value: number | null }[][] = [];
        let currentWeekBuilder: { date: string; value: number | null }[] = [];

        // Pad start
        const firstDate = new Date(calendarGrid[0].date);
        const dayOfWeek = firstDate.getDay(); // 0 is Sunday
        for (let i = 0; i < dayOfWeek; i++) {
            currentWeekBuilder.push({ date: '', value: null });
        }

        calendarGrid.forEach((day) => {
            currentWeekBuilder.push(day);
            if (currentWeekBuilder.length === 7) {
                finalWeeks.push(currentWeekBuilder);
                currentWeekBuilder = [];
            }
        });

        // Pad end
        if (currentWeekBuilder.length > 0) {
            while (currentWeekBuilder.length < 7) {
                currentWeekBuilder.push({ date: '', value: null });
            }
            finalWeeks.push(currentWeekBuilder);
        }

        return finalWeeks;
    }, [calendarGrid]);

    const getColor = (value: number | null) => {
        if (value === null) return 'transparent';
        if (value === 0) return '#1e293b'; // slate-800
        if (value < 50) return '#064e3b'; // emerald-900
        if (value < 200) return '#047857'; // emerald-700
        if (value < 500) return '#10b981'; // emerald-500
        return '#34d399'; // emerald-400
    };

    const cellSize = 12;
    const cellGap = 3;
    const width = weeks.length * (cellSize + cellGap);
    const height = 7 * (cellSize + cellGap);

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center ${className}`}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full max-h-[140px]"
            >
                {weeks.map((week, wIndex) => (
                    week.map((day, dIndex) => (
                        <rect
                            key={`${wIndex}-${dIndex}`}
                            x={wIndex * (cellSize + cellGap)}
                            y={dIndex * (cellSize + cellGap)}
                            width={cellSize}
                            height={cellSize}
                            rx={2}
                            fill={getColor(day.value)}
                            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        >
                            {day.value !== null && (
                                <title>{day.date}: ${day.value}</title>
                            )}
                        </rect>
                    ))
                ))}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 w-full justify-end px-2">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-slate-800" />
                <div className="w-3 h-3 rounded-sm bg-emerald-900" />
                <div className="w-3 h-3 rounded-sm bg-emerald-700" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                <span>More</span>
            </div>
        </div>
    );
};
