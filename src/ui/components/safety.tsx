"use client"
import { ShieldCheck } from 'lucide-react'
const Safety: React.FC = () => {
    return (
<p className="text-center text-gray-500 text-xs mt-6">
           <span className='flex justify-center items-center gap-2  '> Безопасное соединение 
          <ShieldCheck color='#ff6251' />
            </span>
          </p>
    )
}

export default Safety