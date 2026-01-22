'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    targetDate: string | Date
}

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
    const difference = targetDate.getTime() - new Date().getTime()

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    }
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(target))

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(target))
        }, 1000)

        return () => clearInterval(timer)
    }, [target])

    const formatNumber = (num: number) => num.toString().padStart(2, '0')



    const formattedDate = target.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div
            className="flex w-full flex-col items-center justify-center rounded-2xl border border-black/10 py-4 dark:border-white/5 cursor-help transition-colors hover:border-black/20 dark:hover:border-white/10"
            title={`Fecha em: ${formattedDate}`}
        >
            <div className="mb-2 text-xs font-medium text-[#606E85] dark:text-[#A1A7BB]">
                O mercado fechará em
            </div>
            <div className="flex items-center gap-2">
                {/* Days */}
                <div className="flex flex-col items-center">
                    <div className="text-xl font-bold dark:text-white">
                        {timeLeft.days}
                    </div>
                    <div className="text-[10px] text-[#606E85] dark:text-[#A1A7BB]">DIAS</div>
                </div>

                <div className="mb-4 text-xl font-bold dark:text-white">:</div>

                {/* Hours */}
                <div className="flex flex-col items-center">
                    <div className="text-xl font-bold dark:text-white">
                        {formatNumber(timeLeft.hours)}
                    </div>
                    <div className="text-[10px] text-[#606E85] dark:text-[#A1A7BB]">HORAS</div>
                </div>

                <div className="mb-4 text-xl font-bold dark:text-white">:</div>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                    <div className="text-xl font-bold dark:text-white">
                        {formatNumber(timeLeft.minutes)}
                    </div>
                    <div className="text-[10px] text-[#606E85] dark:text-[#A1A7BB]">MINUTOS</div>
                </div>

                <div className="mb-4 text-xl font-bold dark:text-white">:</div>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                    <div className="text-xl font-bold dark:text-white">
                        {formatNumber(timeLeft.seconds)}
                    </div>
                    <div className="text-[10px] text-[#606E85] dark:text-[#A1A7BB]">SEGUNDOS</div>
                </div>
            </div>
        </div>
    )
}
