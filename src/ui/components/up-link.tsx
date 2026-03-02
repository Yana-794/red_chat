"use client"
import { ArrowRight } from 'lucide-react';
import  Link from 'next/link';

interface UpLinkPrors {
    authQuestion: string;
    formType: string;
    to: string;
}
const UpLink: React.FC <UpLinkPrors> = ({authQuestion, formType, to}) => {
 

  return (
    <div className="mt-6 text-center">
      <p className="text-gray-400 text-sm">
        {authQuestion}
        {' '}
        <Link
          href={to}
          className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200 inline-flex items-center gap-1"
        >
          {formType}
          <ArrowRight color="#ff6251" size={16} />
        </Link>
      </p>
    </div>
  );
};

export default UpLink;