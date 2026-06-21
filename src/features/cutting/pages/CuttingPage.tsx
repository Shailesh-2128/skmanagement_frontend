import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import cuttingApi, { CuttingChartData } from '../../../api/cutting.api';
import groupsApi from '../../../api/groups.api';
import Loader from '../../../components/ui/Loader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { 
  Scissors, 
  RotateCcw, 
  Printer, 
  Plus, 
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Undo2,
  Edit3,
  Trash2,
  FileDown,
  Clipboard,
  Info
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface SearchableSelectProps {
  value: string | number;
  onChange: (val: string) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  className?: string;
  createOptionLabel?: string;
  onCreateOption?: () => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  createOptionLabel,
  onCreateOption
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(opt => opt.value.toString() === value.toString());
  
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full bg-transparent text-sm font-bold text-slate-800 flex items-center justify-between cursor-pointer outline-none border-none p-0 pr-4"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="ml-1 text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg z-50 overflow-hidden no-print">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-slate-400 italic">No matches found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value.toString());
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold cursor-pointer ${
                    opt.value.toString() === value.toString() ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
            {createOptionLabel && onCreateOption && (
              <button
                type="button"
                onClick={() => {
                  onCreateOption();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 font-bold border-t border-slate-100 cursor-pointer"
              >
                {createOptionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// The 220 family combinations arranged column by column as shown in the paper image
const COLUMNS = [
  { header: '1', numbers: ['128', '137', '236', '678', '245', '290', '470', '579', '380', '335', '588', '489', '344', '399', '100', '155', '560', '146', '669', '119', '227', '777'] },
  { header: '6', numbers: ['123', '268', '367', '178', '240', '259', '457', '790', '880', '330', '358', '448', '899', '349', '600', '556', '150', '114', '466', '169', '277', '222'] },
  { header: '2', numbers: ['129', '147', '246', '679', '345', '390', '480', '589', '570', '255', '200', '138', '336', '688', '660', '110', '156', '778', '237', '228', '499', '444'] },
  { header: '7', numbers: ['124', '179', '467', '269', '890', '458', '340', '359', '250', '557', '700', '368', '133', '188', '115', '566', '160', '278', '223', '377', '449', '999'] },
  { header: '3', numbers: ['120', '157', '256', '670', '139', '148', '346', '689', '247', '779', '229', '445', '599', '490', '300', '580', '355', '337', '238', '788', '166', '111'] },
  { header: '8', numbers: ['170', '567', '125', '260', '189', '468', '369', '134', '477', '279', '224', '459', '990', '440', '800', '558', '350', '378', '288', '233', '116', '666'] },
  { header: '4', numbers: ['130', '158', '680', '356', '239', '248', '347', '789', '167', '112', '266', '149', '446', '699', '400', '455', '590', '220', '770', '257', '388', '333'] },
  { header: '9', numbers: ['180', '568', '135', '360', '379', '478', '289', '234', '117', '126', '667', '144', '199', '469', '900', '559', '450', '225', '577', '270', '338', '888'] },
  { header: '5', numbers: ['140', '159', '456', '690', '230', '258', '357', '780', '249', '799', '447', '348', '339', '889', '168', '113', '366', '122', '177', '267', '500', '555'] },
  { header: '10', numbers: ['190', '569', '145', '460', '280', '235', '578', '370', '244', '299', '479', '334', '488', '389', '136', '668', '118', '677', '127', '226', '550', '000'] }
];

// Flat list of all valid numbers for faster lookup
const VALID_PANNAS = new Set(COLUMNS.flatMap(col => col.numbers));

// Satta Matka cut digit mapping (1<->6, 2<->7, 3<->8, 4<->9, 5<->0)
const getCutDigit = (d: string): string => {
  switch (d) {
    case '1': return '6';
    case '6': return '1';
    case '2': return '7';
    case '7': return '2';
    case '3': return '8';
    case '8': return '3';
    case '4': return '9';
    case '9': return '4';
    case '5': return '0';
    case '0': return '5';
    default: return d;
  }
};

// Sort digits in Satta Matka ascending order where '0' represents 10 (largest)
const sortMatkaDigits = (digits: string[]): string => {
  const sorted = [...digits].sort((a, b) => {
    const valA = a === '0' ? 10 : parseInt(a, 10);
    const valB = b === '0' ? 10 : parseInt(b, 10);
    return valA - valB;
  });
  return sorted.join('');
};

// Generate all unique family members in 220 chart by replacing each digit with itself or its cut digit
const getFamilyMembers = (panna: string): string[] => {
  if (panna.length !== 3) return [];
  const d1 = panna[0];
  const d2 = panna[1];
  const d3 = panna[2];

  const options1 = [d1, getCutDigit(d1)];
  const options2 = [d2, getCutDigit(d2)];
  const options3 = [d3, getCutDigit(d3)];

  const results = new Set<string>();

  for (const c1 of options1) {
    for (const c2 of options2) {
      for (const c3 of options3) {
        const sorted = sortMatkaDigits([c1, c2, c3]);
        if (VALID_PANNAS.has(sorted)) {
          results.add(sorted);
        }
      }
    }
  }

  return Array.from(results);
};

// Generate all unique family members for Jodi (2-digit) by replacing each digit with itself or its cut digit
const getJodiFamilyMembers = (jodi: string): string[] => {
  if (jodi.length !== 2) return [];
  const d1 = jodi[0];
  const d2 = jodi[1];

  const options1 = [d1, getCutDigit(d1)];
  const options2 = [d2, getCutDigit(d2)];

  const results = new Set<string>();

  for (const c1 of options1) {
    for (const c2 of options2) {
      results.add(c1 + c2);
    }
  }

  return Array.from(results);
};

// Generate family members for SP or DP single digits (1-digit)
const getSingleFamilyMembers = (digit: string): string[] => {
  if (digit.length !== 1) return [];
  return [digit, getCutDigit(digit)];
};

const getPannaType = (panna: string): 'SP' | 'DP' | 'TP' => {
  const s = new Set(panna.split(''));
  if (s.size === 3) return 'SP';
  if (s.size === 2) return 'DP';
  return 'TP';
};

const getSpDpPannasForDigit = (digitStr: string, type: 'sp' | 'dp'): string[] => {
  let targetHeader = digitStr.trim();
  if (targetHeader === '0') {
    targetHeader = '10';
  }
  const column = COLUMNS.find(col => col.header === targetHeader);
  if (!column) return [];
  const targetType = type.toUpperCase() as 'SP' | 'DP';
  return column.numbers.filter(num => getPannaType(num) === targetType);
};

const formatLogNumber = (num: string): string => {
  if (num.startsWith('SU')) return `Sutta-${num.substring(2)}`;
  if (num.startsWith('MPSP_')) return `Motor SP: ${num.replace('MPSP_', '')}`;
  if (num.startsWith('MPDP_')) return `Motor DP: ${num.replace('MPDP_', '')}`;
  if (num.startsWith('SGM_')) return `Sangam: ${num.replace('SGM_', '')}`;
  if (num.startsWith('CHK_')) return `Chakwad: ${num.replace('CHK_', '')}`;
  if (num.startsWith('S') && !num.includes('_')) return `SP-${num.substring(1)}`;
  if (num.startsWith('D') && !num.includes('_')) return `DP-${num.substring(1)}`;
  
  // Custom SP/DP logging mappings
  const spMatch = num.match(/^(\d+)\s*sp$/i);
  if (spMatch) return `SP-${spMatch[1]}`;
  const dpMatch = num.match(/^(\d+)\s*dp$/i);
  if (dpMatch) return `DP-${dpMatch[1]}`;
  
  return num;
};

const getChartTypeLabel = (type: string | undefined): string => {
  if (!type) return 'Chart';
  switch (type.toLowerCase()) {
    case 'panna': return 'Family Chart';
    case 'jodi': return 'Jodi';
    case 'sp': return 'SP';
    case 'dp': return 'DP';
    case 'sutta': return 'Sutta';
    case 'mpsp': return 'Motor SP';
    case 'mpdp': return 'Motor DP';
    case 'sangam': return 'Sangam';
    case 'chakwad': return 'Chakwad';
    default: return type;
  }
};

// Helper rendering functions for compilation print views
const renderPrintPannaTable = (chartAmounts: Record<string, number>, _chartLimit: number, greenLimit: number = 200, yellowLimit: number = 500) => (
  <table className="w-full text-center border-collapse border border-black">
    <thead>
      <tr className="bg-[#facc15] border-b border-black">
        {COLUMNS.map((col) => (
          <th key={col.header} className="py-2 px-1 border border-black text-[#1e3a8a] text-sm font-black w-[10%]">
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="bg-yellow-50/30">
      {Array.from({ length: 22 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-black last:border-b-0">
          {COLUMNS.map((col) => {
            const num = col.numbers[rowIndex];
            const amount = chartAmounts[num] || 0;
            
            let cellBg = 'bg-[#fef08a] text-slate-900';
            if (amount > 0) {
              if (amount <= greenLimit) {
                cellBg = 'bg-emerald-600 text-white font-bold';
              } else if (amount <= yellowLimit) {
                cellBg = 'bg-amber-400 text-slate-900 font-bold';
              } else {
                cellBg = 'bg-red-600 text-white red-cell font-bold';
              }
            }

            return (
              <td
                key={col.header}
                className={`py-2 px-0.5 border border-black align-middle text-xs ${cellBg}`}
              >
                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="font-extrabold">{num}</span>
                  {amount > 0 && <span className="text-[9px] mt-0.5 font-bold">₹{amount}</span>}
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
);

const renderPrintJodiTable = (chartAmounts: Record<string, number>, chartLimit: number, greenLimit: number = 200, yellowLimit: number = 500, showOnlyOverLimit: boolean = false) => (
  <table className="w-full text-center border-collapse border border-black">
    <thead>
      <tr className="bg-[#facc15] border-b border-black">
        <th className="py-2 px-1 border border-black text-[#1e3a8a] text-sm font-black w-[10%]">
          O \ C
        </th>
        {Array.from({ length: 10 }).map((_, c) => (
          <th key={c} className="py-2 px-1 border border-black text-[#1e3a8a] text-sm font-black w-[9%]">
            {c}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="bg-yellow-50/30">
      {Array.from({ length: 10 }).map((_, r) => (
        <tr key={r} className="border-b border-black last:border-b-0">
          <td className="bg-[#facc15] text-[#1e3a8a] py-2 px-0.5 border-r border-black align-middle font-black text-sm">
            {r}
          </td>
          {Array.from({ length: 10 }).map((_, c) => {
            const num = `${r}${c}`;
            const amount = chartAmounts[num] || 0;
            const isOverLimit = amount > chartLimit;
            
            let cellBg = 'bg-[#fef08a] text-slate-900';
            if (amount > 0) {
              if (amount <= greenLimit) {
                cellBg = 'bg-emerald-600 text-white font-bold';
              } else if (amount <= yellowLimit) {
                cellBg = 'bg-amber-400 text-slate-900 font-bold';
              } else {
                cellBg = 'bg-red-600 text-white red-cell font-bold';
              }
            }
            if (showOnlyOverLimit && !isOverLimit) {
              cellBg = 'bg-white text-transparent border border-black';
            }

            return (
              <td
                key={c}
                className={`py-2 px-0.5 border border-black align-middle text-xs ${cellBg}`}
              >
                {(!showOnlyOverLimit || isOverLimit) ? (
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="font-extrabold">{num}</span>
                    {amount > 0 && <span className="text-[9px] mt-0.5 font-bold">₹{amount}</span>}
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
);

const renderPrintSuttaTable = (chartAmounts: Record<string, number>, chartLimit: number, greenLimit: number = 200, yellowLimit: number = 500, showOnlyOverLimit: boolean = false) => (
  <table className="w-full text-center border-collapse border border-black">
    <thead>
      <tr className="bg-[#facc15]">
        {Array.from({ length: 10 }).map((_, digit) => (
          <th key={digit} className="py-2 px-1 border border-black text-[#1e3a8a] text-sm font-black">
            {digit}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      <tr>
        {Array.from({ length: 10 }).map((_, digit) => {
          const numKey = `SU${digit}`;
          const amount = chartAmounts[numKey] || 0;
          const isOverLimit = amount > chartLimit;
          
          let cellBg = 'bg-[#fef08a]';
          if (amount > 0) {
            if (amount <= greenLimit) {
              cellBg = 'bg-emerald-600 text-white font-bold';
            } else if (amount <= yellowLimit) {
              cellBg = 'bg-amber-400 text-slate-900 font-bold';
            } else {
              cellBg = 'bg-red-600 text-white red-cell font-bold';
            }
          }
          if (showOnlyOverLimit && !isOverLimit) {
            cellBg = 'bg-white text-transparent border border-black';
          }

          return (
            <td 
              key={digit} 
              className={`py-2.5 px-1 border border-black font-extrabold text-sm ${cellBg}`}
            >
              {(!showOnlyOverLimit || isOverLimit) ? (
                <div>
                  <div>{digit}</div>
                  {amount > 0 && <div className="text-[10px] mt-1 font-bold">₹{amount}</div>}
                </div>
              ) : (
                <div className="h-6" />
              )}
            </td>
          );
        })}
      </tr>
    </tbody>
  </table>
);

const renderPrintListTable = (chartType: string, chartAmounts: Record<string, number>, chartLimit: number, greenLimit: number = 200, yellowLimit: number = 500, showOnlyOverLimit: boolean = false) => {
  const list: { displayKey: string; amount: number; type: string }[] = [];
  Object.entries(chartAmounts).forEach(([key, val]) => {
    if (typeof val !== 'number' || val <= 0) return;
    if (showOnlyOverLimit && val <= chartLimit) return;
    if (chartType === 'mpsp' && key.startsWith('MPSP_')) {
      list.push({ displayKey: key.replace('MPSP_', ''), amount: val, type: 'Motor Single Pana' });
    } else if (chartType === 'mpdp' && key.startsWith('MPDP_')) {
      list.push({ displayKey: key.replace('MPDP_', ''), amount: val, type: 'Motor Double Pana' });
    } else if (chartType === 'sangam' && key.startsWith('SGM_')) {
      list.push({ displayKey: key.replace('SGM_', ''), amount: val, type: 'Sangam' });
    } else if (chartType === 'chakwad' && key.startsWith('CHK_')) {
      list.push({ displayKey: key.replace('CHK_', ''), amount: val, type: 'Chakwad' });
    }
  });

  if (list.length === 0) {
    return <div className="text-center p-4 border border-black text-sm italic">No entries logged over limit.</div>;
  }

  return (
    <table className="w-full text-left border-collapse border border-black text-xs font-semibold">
      <thead>
        <tr className="bg-[#facc15] border-b border-black text-[10px] font-bold text-slate-900 uppercase">
          <th className="py-2 px-4 border border-black">Number/Digits</th>
          <th className="py-2 px-4 border border-black">Type</th>
          <th className="py-2 px-4 border border-black text-right">Logged Amount</th>
          <th className="py-2 px-4 border border-black text-right">Limit Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black">
        {list.map((entry) => {
          const isOverLimit = entry.amount > chartLimit;
          const percent = Math.min(100, Math.round((entry.amount / chartLimit) * 100));
          
          let rowBg = '';
          if (entry.amount > 0) {
            if (entry.amount <= greenLimit) {
              rowBg = 'bg-emerald-50';
            } else if (entry.amount <= yellowLimit) {
              rowBg = 'bg-amber-50';
            } else {
              rowBg = 'bg-red-200';
            }
          }

          return (
            <tr key={entry.displayKey} className={rowBg}>
              <td className="py-2 px-4 border border-black font-extrabold text-sm">{entry.displayKey}</td>
              <td className="py-2 px-4 border border-black">{entry.type}</td>
              <td className="py-2 px-4 border border-black text-right font-black">₹{entry.amount}</td>
              <td className="py-2 px-4 border border-black text-right">
                {percent}% {isOverLimit ? '(Over Limit!)' : ''}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export const CuttingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isSuperAdmin, user } = useAuth();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('view') || 'panna') as 'panna' | 'jodi' | 'sutta' | 'mpsp' | 'mpdp' | 'sangam' | 'chakwad' | 'add-cutting' | 'analysis';

  // Local helper to get current local date string (YYYY-MM-DD)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State hooks
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [percentage, setPercentage] = useState(100);
  const [selectedSession, setSelectedSession] = useState<string>(() => {
    return localStorage.getItem('active_cutting_session') || 'Open';
  });
  const [quickPasteText, setQuickPasteText] = useState('');
  const [quickPasteLoading, setQuickPasteLoading] = useState(false);
  const [selectedChartName, setSelectedChartName] = useState<string>('');
  const [isCreateChartOpen, setIsCreateChartOpen] = useState(false);
  const [newChartName, setNewChartName] = useState('');

  // Add Cutting Form States
  const [addCuttingGroup, setAddCuttingGroup] = useState<number | 'all'>('all');
  const [addCuttingDate, setAddCuttingDate] = useState(() => getLocalDateString());
  const [addCuttingSession, setAddCuttingSession] = useState('Open');
  const [addCuttingChartName, setAddCuttingChartName] = useState('');
  const [addCuttingType, setAddCuttingType] = useState<string>('panna');
  const [addCuttingNumber, setAddCuttingNumber] = useState('');
  const [addCuttingAmount, setAddCuttingAmount] = useState('');
  const [addCuttingFamily, setAddCuttingFamily] = useState(false);
  const [addCuttingSuccess, setAddCuttingSuccess] = useState('');
  const [addCuttingError, setAddCuttingError] = useState('');
  const [addCuttingLoading, setAddCuttingLoading] = useState(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(false);
  const addCuttingNumberInputRef = useRef<HTMLInputElement>(null);
  
  // Overall setup limits state
  const [overallGreenLimitInput, setOverallGreenLimitInput] = useState('200');
  const [overallYellowLimitInput, setOverallYellowLimitInput] = useState('500');
  const [overallLimitInput, setOverallLimitInput] = useState('1000');

  // Auto-focus the number input on add-cutting view mount
  useEffect(() => {
    if (activeView === 'add-cutting') {
      const timer = setTimeout(() => {
        addCuttingNumberInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeView]);

  // Fetch charts of all types for the current group/date/session and chart name
  const { data: allChartsForSetup } = useQuery<CuttingChartData[]>({
    queryKey: ['cuttingChartsAllTypes', addCuttingGroup, addCuttingDate, addCuttingSession, addCuttingChartName],
    queryFn: () => cuttingApi.getAllTypes(addCuttingGroup, addCuttingDate, addCuttingSession, addCuttingChartName),
    enabled: activeView === 'add-cutting' && addCuttingGroup !== null && !!addCuttingDate && !!addCuttingChartName
  });

  // Sync overallLimitsInput with active setup charts limits
  useEffect(() => {
    if (allChartsForSetup && allChartsForSetup.length > 0) {
      setOverallGreenLimitInput((allChartsForSetup[0].green_limit ?? 200).toString());
      setOverallYellowLimitInput((allChartsForSetup[0].yellow_limit ?? 500).toString());
      setOverallLimitInput(allChartsForSetup[0].limit.toString());
    }
  }, [allChartsForSetup]);

  // Auto-dismiss add-cutting tooltip messages
  useEffect(() => {
    if (addCuttingSuccess) {
      const timer = setTimeout(() => {
        setAddCuttingSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [addCuttingSuccess]);

  useEffect(() => {
    if (addCuttingError) {
      const timer = setTimeout(() => {
        setAddCuttingError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [addCuttingError]);

  // Keep session localStorage in sync
  useEffect(() => {
    localStorage.setItem('active_cutting_session', selectedSession);
  }, [selectedSession]);

  // Fetch all recent tenant logs for the Add Cutting view
  const { data: recentTenantLogs = [], refetch: refetchRecentLogs } = useQuery<any[]>({
    queryKey: ['recentTenantLogs', addCuttingGroup, addCuttingDate],
    queryFn: () => cuttingApi.listLogs(),
    enabled: activeView === 'add-cutting'
  });

  // --- React Query Fetching Groups ---
  const { data: groups, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groupsList', user?.id],
    queryFn: groupsApi.list
  });

  const queryGroupId = searchParams.get('groupId');
  const [selectedGroupId, setSelectedGroupId] = useState<number | 'all' | null>(() => {
    const saved = localStorage.getItem('active_cutting_group_id');
    if (saved === 'all') return 'all';
    return saved ? parseInt(saved, 10) : null;
  });

  // Keep localStorage in sync
  useEffect(() => {
    if (selectedGroupId !== null) {
      localStorage.setItem('active_cutting_group_id', selectedGroupId.toString());
    } else {
      localStorage.removeItem('active_cutting_group_id');
    }
  }, [selectedGroupId]);

  // Sync search param groupId or fallback to first group/valid group from groups list
  useEffect(() => {
    if (groups) {
      if (queryGroupId) {
        if (queryGroupId === 'all') {
          setSelectedGroupId('all');
        } else {
          const queryIdParsed = parseInt(queryGroupId, 10);
          const queryValid = groups.some((g: any) => g.id === queryIdParsed);
          if (queryValid) {
            setSelectedGroupId(queryIdParsed);
          } else {
            setSelectedGroupId('all');
          }
        }
      } else {
        const isValid = selectedGroupId === 'all' || (selectedGroupId !== null && groups.some((g: any) => g.id === selectedGroupId));
        if (!isValid) {
          setSelectedGroupId('all');
        }
      }
    }
  }, [queryGroupId, groups, selectedGroupId, setSearchParams]);

  // --- Fetch Unique Chart Names for selected Group and Date ---
  const { data: chartNames = [] } = useQuery<string[]>({
    queryKey: ['cuttingChartNames', selectedGroupId, selectedDate],
    queryFn: async () => {
      if (selectedGroupId === null) return [];
      return cuttingApi.listNames(selectedGroupId, selectedDate);
    },
    enabled: selectedGroupId !== null && !!selectedDate
  });

  // Sync selectedChartName with fetched names
  useEffect(() => {
    if (chartNames.length > 0) {
      if (!chartNames.includes(selectedChartName)) {
        setSelectedChartName(chartNames[0]);
      }
    } else {
      setSelectedChartName('');
    }
  }, [chartNames]);

  // --- Fetch Chart Names for Add Cutting form dynamically ---
  const { data: addCuttingChartNames = [] } = useQuery<string[]>({
    queryKey: ['cuttingChartNames', addCuttingGroup, addCuttingDate],
    queryFn: async () => {
      if (addCuttingGroup === null) return [];
      return cuttingApi.listNames(addCuttingGroup, addCuttingDate);
    },
    enabled: addCuttingGroup !== null && !!addCuttingDate
  });

  // Sync addCuttingChartName with fetched names
  useEffect(() => {
    if (addCuttingChartNames.length > 0) {
      if (!addCuttingChartNames.includes(addCuttingChartName)) {
        setAddCuttingChartName(addCuttingChartNames[0]);
      }
    } else {
      setAddCuttingChartName('');
    }
  }, [addCuttingChartNames]);

  // --- Fetch Active Chart dynamically by Group, Date, Active View, Session, and Chart Name ---
  const { data: activeChart, isLoading: isChartLoading } = useQuery<CuttingChartData | null>({
    queryKey: ['cuttingChart', selectedGroupId, selectedDate, activeView, selectedSession, selectedChartName],
    queryFn: async () => {
      if (selectedGroupId === null || !selectedChartName) return null;
      const queryType = activeView === 'analysis' ? 'panna' : activeView;
      return cuttingApi.getOrCreateChart(selectedGroupId, selectedDate, queryType, selectedSession, selectedChartName);
    },
    enabled: selectedGroupId !== null && !!selectedDate && !!activeView && !!selectedSession && !!selectedChartName && activeView !== 'add-cutting'
  });

  // Analysis payout configurations (per 10 INR)
  const [spPayout, setSpPayout] = useState(1500);
  const [dpPayout, setDpPayout] = useState(3000);
  const [tpPayout, setTpPayout] = useState(10000);

  // Custom analysis Total Volume (to override totalCuttingVolume for testing/what-if)
  const [analysisTotalVolumeInput, setAnalysisTotalVolumeInput] = useState('');
  const [isTotalVolumeOverridden, setIsTotalVolumeOverridden] = useState(false);

  const analysisAmounts = activeChart?.amounts || {};
  const actualTotalCuttingVolume = Object.values(analysisAmounts).reduce((sum, val) => sum + (val || 0), 0);

  useEffect(() => {
    if (!isTotalVolumeOverridden) {
      setAnalysisTotalVolumeInput(actualTotalCuttingVolume.toString());
    }
  }, [actualTotalCuttingVolume, isTotalVolumeOverridden]);

  // Invalidate chart names list query whenever the active chart name changes
  useEffect(() => {
    if (activeChart?.name) {
      queryClient.invalidateQueries({ queryKey: ['cuttingChartNames', selectedGroupId, selectedDate] });
    }
  }, [activeChart?.name, selectedGroupId, selectedDate, queryClient]);


  // Entry Form States
  const [entryNumber, setEntryNumber] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryMode, setEntryMode] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [applyFamily, setApplyFamily] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPdfHint, setShowPdfHint] = useState(false);
  const [allChartsToPrint, setAllChartsToPrint] = useState<CuttingChartData[] | null>(null);
  const [isFetchingAllCharts, setIsFetchingAllCharts] = useState(false);

  // Interactive Modal States
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [cellModalAmount, setCellModalAmount] = useState('');
  const [cellModalMode, setCellModalMode] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [cellModalApplyFamily, setCellModalApplyFamily] = useState(false);

  // Chart Management Modal States
  const [isRenameChartOpen, setIsRenameChartOpen] = useState(false);
  const [renameChartName, setRenameChartName] = useState('');
  const [chartError, setChartError] = useState('');

  // Search/Highlight State
  const [searchQuery, setSearchQuery] = useState('');

  // Local limits input state
  const [greenLimitInput, setGreenLimitInput] = useState('200');
  const [yellowLimitInput, setYellowLimitInput] = useState('500');
  const [limitInput, setLimitInput] = useState('1000');
  const [highlightOverLimitOnly, setHighlightOverLimitOnly] = useState(false);

  // Date Quick Preset Handlers
  const handleSetToday = () => {
    setSelectedDate(getLocalDateString());
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(getLocalDateString(yesterday));
  };

  const handleSetPreviousDate = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(getLocalDateString(current));
  };

  // --- Mutations ---


  const updateChartMutation = useMutation({
    mutationFn: ({ id, name, limit, green_limit, yellow_limit }: { id: number; name?: string; limit?: number; green_limit?: number; yellow_limit?: number }) =>
      cuttingApi.updateChart(id, { name, limit, green_limit, yellow_limit }),
    onSuccess: (data: CuttingChartData) => {
      queryClient.invalidateQueries({ queryKey: ['cuttingChart', selectedGroupId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['cuttingChartNames', selectedGroupId, selectedDate] });
      if (data && data.name) {
        setSelectedChartName(data.name);
      }
      setIsRenameChartOpen(false);
    },
    onError: (err: any) => {
      setChartError(err?.response?.data?.detail || 'Failed to update chart.');
    }
  });

  const bulkLimitMutation = useMutation({
    mutationFn: ({ groupId, date, session, limit, green_limit, yellow_limit }: { 
      groupId: number | 'all'; 
      date: string; 
      session: string; 
      limit: number; 
      green_limit: number; 
      yellow_limit: number; 
    }) =>
      cuttingApi.bulkUpdateLimit(groupId, date, session, limit, green_limit, yellow_limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuttingChart'] });
      queryClient.invalidateQueries({ queryKey: ['cuttingChartsAllTypes'] });
      setAddCuttingSuccess('Overall threshold limits updated successfully!');
    },
    onError: (err: any) => {
      setAddCuttingError(err?.response?.data?.detail || 'Failed to update overall limits.');
    }
  });

  const handleOverallLimitsBlur = () => {
    const nextLimit = Math.max(0, parseInt(overallLimitInput, 10) || 0);
    const nextGreen = Math.max(0, parseInt(overallGreenLimitInput, 10) || 0);
    const nextYellow = Math.max(0, parseInt(overallYellowLimitInput, 10) || 0);

    if (allChartsForSetup && allChartsForSetup.length > 0) {
      const currentLimit = allChartsForSetup[0].limit;
      const currentGreen = allChartsForSetup[0].green_limit ?? 200;
      const currentYellow = allChartsForSetup[0].yellow_limit ?? 500;

      if (nextLimit !== currentLimit || nextGreen !== currentGreen || nextYellow !== currentYellow) {
        bulkLimitMutation.mutate({
          groupId: addCuttingGroup,
          date: addCuttingDate,
          session: addCuttingSession,
          limit: nextLimit,
          green_limit: nextGreen,
          yellow_limit: nextYellow
        });
      }
    }
  };

  const handleLimitsBlur = () => {
    if (!activeChart) return;
    const nextLimit = Math.max(0, parseInt(limitInput, 10) || 0);
    const nextGreen = Math.max(0, parseInt(greenLimitInput, 10) || 0);
    const nextYellow = Math.max(0, parseInt(yellowLimitInput, 10) || 0);
    
    if (
      nextLimit !== activeChart.limit ||
      nextGreen !== (activeChart.green_limit ?? 200) ||
      nextYellow !== (activeChart.yellow_limit ?? 500)
    ) {
      updateChartMutation.mutate({ 
        id: activeChart.id, 
        limit: nextLimit, 
        green_limit: nextGreen, 
        yellow_limit: nextYellow 
      });
    }
  };

  const renderActiveChartGrid = (targetChart: CuttingChartData | null, targetView: string) => {
    if (!targetChart) return null;
    const chartAmounts = targetChart.amounts || {};
    const chartLimit = targetChart.limit || 1000;
    const greenLimit = targetChart.green_limit ?? 200;
    const yellowLimit = targetChart.yellow_limit ?? 500;
    const redLimit = chartLimit;

    const list: { key: string; displayKey: string; amount: number; type: string }[] = [];
    Object.entries(chartAmounts).forEach(([key, val]) => {
      if (typeof val !== 'number' || val <= 0) return;
      if (key.startsWith('MPSP_')) {
        list.push({ key, displayKey: key.replace('MPSP_', ''), amount: val, type: 'Motor Single Pana (MPSP)' });
      } else if (key.startsWith('MPDP_')) {
        list.push({ key, displayKey: key.replace('MPDP_', ''), amount: val, type: 'Motor Double Pana (MPDP)' });
      } else if (key.startsWith('SGM_')) {
        list.push({ key, displayKey: key.replace('SGM_', ''), amount: val, type: 'Sangam' });
      } else if (key.startsWith('CHK_')) {
        list.push({ key, displayKey: key.replace('CHK_', ''), amount: val, type: 'Chakwad' });
      }
    });

    const currentTabEntries = list.filter(entry => {
      if (targetView === 'mpsp') return entry.key.startsWith('MPSP_');
      if (targetView === 'mpdp') return entry.key.startsWith('MPDP_');
      if (targetView === 'sangam') return entry.key.startsWith('SGM_');
      if (targetView === 'chakwad') return entry.key.startsWith('CHK_');
      return false;
    });

    return (
      <div className="space-y-4">
        {/* Panna Chart */}
        {targetView === 'panna' && (
          <div className="flex flex-col border border-black rounded-sm overflow-hidden bg-white max-w-full">
            {/* Title Row */}
            <div className="bg-[#facc15] text-[#b91c1c] text-2xl md:text-3xl font-extrabold text-center py-4 border-b-2 border-black tracking-widest uppercase select-none print-title">
              Family Chart - {targetChart.name}
            </div>

            {/* Grid Scrollable Wrapper */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-center border-collapse select-none">
                <thead>
                  <tr className="bg-[#facc15] border-b border-black">
                    {COLUMNS.map((col) => (
                      <th
                        key={col.header}
                        className="py-2.5 px-1 border-r border-black last:border-r-0 text-[#1e3a8a] text-lg font-black tracking-wider w-[10%]"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-yellow-50/30">
                  {Array.from({ length: 22 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-black last:border-b-0">
                      {COLUMNS.map((col) => {
                        const num = col.numbers[rowIndex];
                        const amount = chartAmounts[num] || 0;
                        const isOverLimit = amount > redLimit;
                        const isHighlighted = searchQuery === num;

                        let cellColorClass = 'bg-[#fef08a] text-slate-900 hover:bg-yellow-200/80';
                        if (amount > 0) {
                          if (amount <= greenLimit) {
                            cellColorClass = 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold';
                          } else if (amount <= yellowLimit) {
                            cellColorClass = 'bg-amber-500 text-slate-900 hover:bg-amber-600 font-bold';
                          } else {
                            cellColorClass = 'bg-red-600 text-white hover:bg-red-700 red-cell font-bold';
                          }
                        }
                        if (isHighlighted) {
                          cellColorClass = 'bg-blue-200 text-slate-900 border-2 border-blue-500 font-extrabold scale-[1.02] z-10';
                        }

                        return (
                          <td
                            key={col.header}
                            onClick={() => handleCellClick(num)}
                            className={`py-3 px-0.5 border-r border-black last:border-r-0 align-middle cursor-pointer transition-all duration-150 relative ${cellColorClass} ${
                              highlightOverLimitOnly && !isOverLimit ? 'opacity-15 blur-[0.2px] grayscale transition-opacity duration-200' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center leading-tight">
                              <span className="font-extrabold text-sm md:text-base tracking-wide">
                                {num}
                              </span>
                              {amount > 0 && (
                                <span className={`text-[10px] md:text-xs font-bold mt-1 px-1 rounded-sm ${
                                  amount <= greenLimit ? 'bg-white/20 text-white shadow-sm' :
                                  amount <= yellowLimit ? 'bg-black/10 text-slate-900 shadow-sm' :
                                  'bg-white text-red-700 shadow-sm'
                                }`}>
                                  ₹{amount}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis View (Panna Profit & Loss) */}
        {targetView === 'analysis' && (() => {
          const totalVolumeThreshold = isTotalVolumeOverridden 
            ? (parseFloat(analysisTotalVolumeInput) || 0) 
            : totalCuttingVolume;

          const activePannas: {
            num: string;
            amount: number;
            type: 'SP' | 'DP' | 'TP';
            multiplier: number;
            winningAmount: number;
            ratioPercent: number;
          }[] = [];

          // Walk through all COLUMNS flat numbers
          COLUMNS.flatMap(col => col.numbers).forEach(num => {
            const amount = chartAmounts[num] || 0;
            if (amount > 0) {
              const pannaType = getPannaType(num);
              let multiplier = 0;
              if (pannaType === 'SP') multiplier = spPayout / 10;
              else if (pannaType === 'DP') multiplier = dpPayout / 10;
              else multiplier = tpPayout / 10;

              const winningAmount = amount * multiplier;
              const ratioPercent = totalVolumeThreshold > 0 
                ? Math.round((winningAmount / totalVolumeThreshold) * 100) 
                : winningAmount > 0 ? 100 : 0;

              activePannas.push({
                num,
                amount,
                type: pannaType,
                multiplier,
                winningAmount,
                ratioPercent
              });
            }
          });

          // Classify into three lists
          const overLimitList = activePannas.filter(p => p.winningAmount > totalVolumeThreshold);
          const cutToCutList = activePannas.filter(p => p.winningAmount >= totalVolumeThreshold * 0.8 && p.winningAmount <= totalVolumeThreshold);
          const greenList = activePannas.filter(p => p.winningAmount < totalVolumeThreshold * 0.8);

          // Sort each list by Winning Payout descending
          const sortedOverLimit = [...overLimitList].sort((a, b) => b.winningAmount - a.winningAmount);
          const sortedCutToCut = [...cutToCutList].sort((a, b) => b.winningAmount - a.winningAmount);
          const sortedGreen = [...greenList].sort((a, b) => b.winningAmount - a.winningAmount);

          const renderRiskTable = (
            list: typeof activePannas, 
            riskType: 'over' | 'cut' | 'green',
            emptyMessage: string
          ) => {
            return (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Panna</th>
                      <th className="py-2.5 px-3 text-right">Bet</th>
                      <th className="py-2.5 px-3 text-right">Payout</th>
                      <th className="py-2.5 px-2 text-center no-print">Act</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-405 text-slate-400 italic font-medium">
                          {emptyMessage}
                        </td>
                      </tr>
                    ) : (
                      list.map(p => {
                        const isSearched = searchQuery && p.num === searchQuery;
                        const rowHighlightClass = isSearched 
                          ? 'bg-blue-50/60 ring-2 ring-blue-500/20 scale-[1.01] transition-all z-10' 
                          : 'hover:bg-slate-50/50';

                        let payoutColor = 'text-emerald-600';
                        if (riskType === 'over') payoutColor = 'text-red-600';
                        else if (riskType === 'cut') payoutColor = 'text-amber-500';

                        return (
                          <tr 
                            key={p.num} 
                            onClick={() => handleCellClick(p.num)}
                            className={`cursor-pointer transition duration-100 ${rowHighlightClass}`}
                            title="Click to adjust amount"
                          >
                            {/* Panna & Type badge inside cell */}
                            <td className="py-2.5 px-3 flex items-center gap-1.5 min-w-[90px]">
                              <span className="font-extrabold text-slate-800 text-sm">{p.num}</span>
                              <span className={`text-[8px] font-black px-1 py-0.2 rounded scale-90 ${
                                p.type === 'SP' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' :
                                p.type === 'DP' ? 'bg-purple-50 text-purple-600 border border-purple-100/50' :
                                'bg-amber-50 text-amber-700 border border-amber-100/50'
                              }`}>
                                {p.type}
                              </span>
                            </td>

                            {/* Bet Amount */}
                            <td className="py-2.5 px-3 text-right text-slate-600 font-medium">
                              ₹{p.amount}
                            </td>

                            {/* Winning Payout & Payout Ratio percentage */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex flex-col items-end leading-none">
                                <span className={`font-black ${payoutColor}`}>₹{p.winningAmount}</span>
                                <span className="text-[8px] text-slate-400 font-bold mt-0.5">{p.ratioPercent}% ratio</span>
                              </div>
                            </td>

                            {/* Tiny Adjust Button inside row */}
                            <td className="py-2.5 px-2 text-center no-print" onClick={(e) => { e.stopPropagation(); handleCellClick(p.num); }}>
                              <button className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 rounded-md text-[9px] font-extrabold text-slate-500 hover:text-slate-700 transition">
                                Adjust
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            );
          };

          return (
            <div className="flex flex-col gap-6">
              {/* Premium Dark Control Card */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-xl select-none no-print relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-wide uppercase bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      Panna P&L Risk Dashboard
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Configure payout multipliers and threshold volume to audit risk in real-time.
                    </p>
                  </div>
                  {/* Status Pills */}
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-slate-700 uppercase tracking-wider">
                      SP: {spPayout / 10}x
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-slate-700 uppercase tracking-wider">
                      DP: {dpPayout / 10}x
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-slate-700 uppercase tracking-wider">
                      TP: {tpPayout / 10}x
                    </span>
                  </div>
                </div>

                {/* Dynamic Inputs grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 relative">
                  {/* SP Payout */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">SP Payout (per ₹10)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={spPayout}
                        onChange={(e) => setSpPayout(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-slate-650"
                      />
                    </div>
                  </div>

                  {/* DP Payout */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">DP Payout (per ₹10)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={dpPayout}
                        onChange={(e) => setDpPayout(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-slate-650"
                      />
                    </div>
                  </div>

                  {/* TP Payout */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">TP Payout (per ₹10)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={tpPayout}
                        onChange={(e) => setTpPayout(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-slate-650"
                      />
                    </div>
                  </div>

                  {/* Compare Total Volume Threshold */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Comparison Volume</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          value={analysisTotalVolumeInput}
                          onChange={(e) => {
                            setAnalysisTotalVolumeInput(e.target.value);
                            setIsTotalVolumeOverridden(true);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 pl-7 pr-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-slate-650"
                        />
                      </div>
                      {isTotalVolumeOverridden && (
                        <button
                          type="button"
                          onClick={() => setIsTotalVolumeOverridden(false)}
                          className="bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl text-[10px] font-bold text-white transition whitespace-nowrap cursor-pointer shadow-md hover:shadow-indigo-500/20"
                          title="Sync with actual volume logged"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Side-by-Side Tables Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Over Limit Column Table */}
                <div className="bg-white rounded-3xl border border-red-100 shadow-sm flex flex-col min-h-[500px] overflow-hidden">
                  <div className="bg-gradient-to-r from-red-50/50 to-rose-50/50 px-5 py-4 border-b border-red-100 flex items-center justify-between">
                    <span className="text-sm font-black text-red-700 tracking-wide uppercase flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                      Over Limit
                    </span>
                    <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      {sortedOverLimit.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
                    {renderRiskTable(sortedOverLimit, 'over', 'No overloaded active bets.')}
                  </div>
                </div>

                {/* 2. Cut to Cut Column Table */}
                <div className="bg-white rounded-3xl border border-amber-100 shadow-sm flex flex-col min-h-[500px] overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                    <span className="text-sm font-black text-amber-700 tracking-wide uppercase flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Cut to Cut
                    </span>
                    <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      {sortedCutToCut.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
                    {renderRiskTable(sortedCutToCut, 'cut', 'No warning active bets.')}
                  </div>
                </div>

                {/* 3. Green Column Table */}
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm flex flex-col min-h-[500px] overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-5 py-4 border-b border-emerald-100 flex items-center justify-between">
                    <span className="text-sm font-black text-emerald-700 tracking-wide uppercase flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Green (Okay)
                    </span>
                    <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      {sortedGreen.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
                    {renderRiskTable(sortedGreen, 'green', 'No active bets under safe levels.')}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Jodi Chart */}
        {targetView === 'jodi' && (
          <div className="flex flex-col border border-black rounded-sm overflow-hidden bg-white max-w-full">
            {/* Title Row */}
            <div className="bg-[#facc15] text-[#b91c1c] text-2xl md:text-3xl font-extrabold text-center py-4 border-b-2 border-black tracking-widest uppercase select-none print-title">
              Jodi Chart - {targetChart.name}
            </div>

            {/* Grid Scrollable Wrapper */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-center border-collapse select-none">
                <thead>
                  <tr className="bg-[#facc15] border-b border-black">
                    <th className="py-2.5 px-1 border-r border-black text-[#1e3a8a] text-lg font-black tracking-wider w-[10%]">
                      O \ C
                    </th>
                    {Array.from({ length: 10 }).map((_, c) => (
                      <th
                        key={c}
                        className="py-2.5 px-1 border-r border-black last:border-r-0 text-[#1e3a8a] text-lg font-black tracking-wider w-[9%]"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-yellow-50/30">
                  {Array.from({ length: 10 }).map((_, r) => (
                    <tr key={r} className="border-b border-black last:border-b-0">
                      {/* Row Header representing Open digit */}
                      <td className="bg-[#facc15] text-[#1e3a8a] py-3 px-0.5 border-r border-black align-middle font-black text-lg">
                        {r}
                      </td>
                      {Array.from({ length: 10 }).map((_, c) => {
                        const num = `${r}${c}`;
                        const amount = chartAmounts[num] || 0;
                        const isOverLimit = amount > redLimit;
                        const isHighlighted = searchQuery === num;

                        let cellColorClass = 'bg-[#fef08a] text-slate-900 hover:bg-yellow-200/80';
                        if (amount > 0) {
                          if (amount <= greenLimit) {
                            cellColorClass = 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold';
                          } else if (amount <= yellowLimit) {
                            cellColorClass = 'bg-amber-500 text-slate-900 hover:bg-amber-600 font-bold';
                          } else {
                            cellColorClass = 'bg-red-600 text-white hover:bg-red-700 red-cell font-bold';
                          }
                        }
                        if (isHighlighted) {
                          cellColorClass = 'bg-blue-200 text-slate-900 border-2 border-blue-500 font-extrabold scale-[1.02] z-10';
                        }

                        return (
                          <td
                            key={c}
                            onClick={() => handleCellClick(num)}
                            className={`py-3 px-0.5 border-r border-black last:border-r-0 align-middle cursor-pointer transition-all duration-150 relative ${cellColorClass} ${
                              highlightOverLimitOnly && !isOverLimit ? 'opacity-15 blur-[0.2px] grayscale transition-opacity duration-200' : ''
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center leading-tight">
                              <span className="font-extrabold text-sm md:text-base tracking-wide">
                                {num}
                              </span>
                              {amount > 0 && (
                                <span className={`text-[10px] md:text-xs font-bold mt-1 px-1 rounded-sm ${
                                  amount <= greenLimit ? 'bg-white/20 text-white shadow-sm' :
                                  amount <= yellowLimit ? 'bg-black/10 text-slate-900 shadow-sm' :
                                  'bg-white text-red-700 shadow-sm'
                                }`}>
                                  ₹{amount}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sutta Chart */}
        {targetView === 'sutta' && (
          <div className="flex flex-col gap-4">
            {/* Title Card */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-md select-none flex justify-between items-center no-print">
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-wide uppercase">
                  Sutta Chart (0-9)
                </h3>
                <p className="text-emerald-100 text-sm mt-1">
                  Monitor and adjust limits for Sutta single digits.
                </p>
              </div>
              <span className="bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Sutta View
              </span>
            </div>

            {/* Print Title */}
            <div className="hidden print:block bg-[#facc15] text-[#b91c1c] text-2xl font-extrabold text-center py-4 border-2 border-black tracking-widest uppercase select-none print-title">
              Sutta Chart - {targetChart.name}
            </div>

            {/* Cards Container */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 print-spdp-grid no-print">
              {Array.from({ length: 10 }).map((_, digit) => {
                const numKey = `SU${digit}`;
                const amount = chartAmounts[numKey] || 0;
                const isOverLimit = amount > redLimit;
                const isHighlighted = searchQuery === String(digit);
                const percent = Math.min(100, Math.round((amount / redLimit) * 100));

                let cardStyle = 'border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5';
                let progressColor = 'bg-teal-500';
                
                if (amount > 0) {
                  if (amount <= greenLimit) {
                    cardStyle = 'border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-50';
                    progressColor = 'bg-emerald-500';
                  } else if (amount <= yellowLimit) {
                    cardStyle = 'border-amber-500 bg-amber-50/10 ring-2 ring-amber-50';
                    progressColor = 'bg-amber-500';
                  } else {
                    cardStyle = 'border-red-500 bg-red-50/10 ring-2 ring-red-100';
                    progressColor = 'bg-red-600 animate-pulse';
                  }
                }
                
                if (isHighlighted) {
                  cardStyle = 'border-blue-500 ring-2 ring-blue-100 scale-[1.03] shadow-md z-10';
                }

                return (
                  <div
                    key={digit}
                    onClick={() => handleCellClick(numKey)}
                    className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 relative cursor-pointer group flex flex-col justify-between select-none ${cardStyle} ${
                      highlightOverLimitOnly && !isOverLimit ? 'opacity-20 blur-[0.2px] grayscale transition-opacity duration-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                          Digit
                        </span>
                        <h4 className="text-4xl font-black text-slate-800 leading-none mt-1 group-hover:text-teal-600 transition-colors">
                          {digit}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        amount > 0
                          ? amount <= greenLimit ? 'bg-emerald-100 text-emerald-700' :
                            amount <= yellowLimit ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        Sutta
                      </span>
                    </div>

                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-lg font-black ${
                          amount > 0
                            ? amount <= greenLimit ? 'text-emerald-600' :
                              amount <= yellowLimit ? 'text-amber-500' :
                              'text-red-600'
                            : 'text-slate-800'
                        }`}>
                          ₹{amount}
                        </span>
                        <span className="text-slate-400 text-[10px] font-semibold">
                          Limit: ₹{chartLimit}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`${progressColor} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className={
                            amount > 0
                              ? amount <= greenLimit ? 'text-emerald-600' :
                                amount <= yellowLimit ? 'text-amber-500' :
                                'text-red-600'
                              : 'text-slate-500'
                          }>
                            {percent}% Used
                          </span>
                          {isOverLimit && (
                            <span className="text-red-600 animate-pulse flex items-center gap-0.5">
                              Over Limit!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Printable Table View for Sutta (Only shown when printing) */}
            <div className="hidden print:block w-full">
              <table className="w-full text-center border-collapse border border-black">
                <thead>
                  <tr className="bg-[#facc15]">
                    {Array.from({ length: 10 }).map((_, digit) => (
                      <th key={digit} className="py-2 px-1 border border-black text-[#1e3a8a] text-sm font-black">
                        {digit}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Array.from({ length: 10 }).map((_, digit) => {
                      const numKey = `SU${digit}`;
                      const amount = chartAmounts[numKey] || 0;
                      
                      let cellColorClass = 'bg-[#fef08a]';
                      if (amount > 0) {
                        if (amount <= greenLimit) {
                          cellColorClass = 'bg-emerald-600 text-white font-bold';
                        } else if (amount <= yellowLimit) {
                          cellColorClass = 'bg-amber-400 text-slate-900 font-bold';
                        } else {
                          cellColorClass = 'bg-red-600 text-white red-cell font-bold';
                        }
                      }
                      
                      return (
                        <td 
                          key={digit} 
                          className={`py-3 px-1 border border-black font-extrabold text-sm ${cellColorClass}`}
                        >
                          <div>
                            <div>{digit}</div>
                            {amount > 0 && <div className="text-[10px] mt-1">₹{amount}</div>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Motor / Sangam / Chakwad Lists */}
        {(targetView === 'mpsp' || targetView === 'mpdp' || targetView === 'sangam' || targetView === 'chakwad') && (
          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md select-none flex justify-between items-center no-print">
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-wide uppercase">
                  {targetView === 'mpsp' ? 'Motor Single Pana (MPSP)' :
                   targetView === 'mpdp' ? 'Motor Double Pana (MPDP)' :
                   targetView === 'sangam' ? 'Sangam' : 'Chakwad'}
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  Manage aggregated volume and limits.
                </p>
              </div>
              <span className="bg-white/20 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {targetView.toUpperCase()}
              </span>
            </div>

            <div className="hidden print:block bg-[#facc15] text-[#b91c1c] text-2xl font-extrabold text-center py-4 border-2 border-black tracking-widest uppercase select-none print-title">
              {targetView === 'mpsp' ? 'Motor Single Pana (MPSP)' : targetView === 'mpdp' ? 'Motor Double Pana (MPDP)' : targetView === 'sangam' ? 'Sangam' : 'Chakwad'} - {targetChart.name}
            </div>

            {/* Table of Entries */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Active Bets ({currentTabEntries.length})
                </span>
              </div>
              {currentTabEntries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">
                  No entries logged for this type yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-6">Number/Digits</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6 text-right">Logged Amount</th>
                        <th className="py-3 px-6 text-right">Limit Status</th>
                        <th className="py-3 px-6 text-center no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {currentTabEntries.map((entry) => {
                        const isOverLimit = entry.amount > redLimit;
                        const percent = Math.min(100, Math.round((entry.amount / redLimit) * 100));
                        
                        let rowBg = '';
                        let progressColor = 'bg-emerald-500';
                        if (entry.amount > 0) {
                          if (entry.amount <= greenLimit) {
                            rowBg = 'bg-emerald-50/5 hover:bg-emerald-50/15';
                            progressColor = 'bg-emerald-500';
                          } else if (entry.amount <= yellowLimit) {
                            rowBg = 'bg-amber-50/5 hover:bg-amber-50/15';
                            progressColor = 'bg-amber-500';
                          } else {
                            rowBg = 'bg-red-50/10 hover:bg-red-50/20';
                            progressColor = 'bg-red-500 animate-pulse';
                          }
                        }

                        return (
                          <tr key={entry.key} className={`hover:bg-slate-50/80 transition ${rowBg} ${
                            highlightOverLimitOnly && !isOverLimit ? 'opacity-20 grayscale transition-opacity duration-200' : ''
                          }`}>
                            <td className="py-4 px-6 font-extrabold text-slate-800 text-lg">
                              {entry.displayKey}
                            </td>
                            <td className="py-4 px-6 text-xs">
                              <span className={`px-2 py-0.5 rounded-full border ${
                                entry.amount <= greenLimit ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                entry.amount <= yellowLimit ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right text-lg font-black text-slate-800">
                              ₹{entry.amount}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs ${
                                  entry.amount <= greenLimit ? 'text-emerald-600' :
                                  entry.amount <= yellowLimit ? 'text-amber-500 font-bold' :
                                  'text-red-600 font-bold'
                                }`}>
                                  {percent}% of limit
                                </span>
                                <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${progressColor}`} 
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center no-print">
                              <button
                                onClick={() => handleCellClick(entry.key)}
                                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs transition cursor-pointer"
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-2 italic no-print text-center flex items-center justify-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" />
          Tip: You can click on any cell in the chart to quickly add or adjust its logged amount!
        </p>
      </div>
    );
  };

  const deleteChartMutation = useMutation({
    mutationFn: cuttingApi.deleteChart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuttingChart', selectedGroupId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['cuttingChartNames', selectedGroupId, selectedDate] });
    }
  });

  const resetChartMutation = useMutation({
    mutationFn: cuttingApi.resetChart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuttingChart', selectedGroupId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['cuttingChartNames', selectedGroupId, selectedDate] });
      setFormError('');
    }
  });

  const logEntryMutation = useMutation({
    mutationFn: ({ chartId, data }: {
      chartId: number;
      data: {
        number: string;
        amount: number;
        type: 'ADD' | 'SUBTRACT' | 'SET';
        is_family: boolean;
        affected_numbers: string[];
      };
    }) => cuttingApi.logEntry(chartId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuttingChart', selectedGroupId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['cuttingChartNames', selectedGroupId, selectedDate] });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || 'Failed to record entry.');
    }
  });

  const deleteLogMutation = useMutation({
    mutationFn: cuttingApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuttingChart', selectedGroupId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['cuttingChartNames', selectedGroupId, selectedDate] });
    }
  });

  // Sync local limit input with active chart limit
  useEffect(() => {
    if (activeChart) {
      setLimitInput(activeChart.limit.toString());
    }
  }, [activeChart?.id, activeChart?.limit]);

  if (isGroupsLoading || isChartLoading || !groups) {
    return <Loader />;
  }

  if (selectedGroupId === null) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500">
        <p className="font-semibold text-lg">No groups available.</p>
        <p className="text-sm mt-1">Please create a group first to manage cutting charts.</p>
      </div>
    );
  }



  if (activeView !== 'add-cutting' && selectedChartName && !activeChart) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500">
        <div className="mb-4">
          <Loader />
        </div>
        <p className="font-semibold">Loading or creating cutting chart...</p>
      </div>
    );
  }

  const amounts = activeChart?.amounts || {};
  const limit = activeChart?.limit || 1000;
  const logs = activeChart?.logs || [];



  // --- Calculations ---
  const totalCuttingVolume = Object.values(amounts).reduce((sum, val) => sum + (val || 0), 0);
  const overLimitCount = Object.values(amounts).filter(val => val > limit).length;



  const handleOpenRenameChart = () => {
    if (!activeChart) return;
    setRenameChartName(activeChart.name);
    setChartError('');
    setIsRenameChartOpen(true);
  };

  const handleRenameChartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChart) return;
    const cleanName = renameChartName.trim();
    if (!cleanName) {
      setChartError('Chart name cannot be empty.');
      return;
    }
    if (cleanName === activeChart.name) {
      setIsRenameChartOpen(false);
      return;
    }
    updateChartMutation.mutate({ id: activeChart.id, name: cleanName });
  };

  const handleCreateChartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newChartName.trim();
    if (!cleanName) {
      setChartError('Chart name cannot be empty.');
      return;
    }
    if (activeView === 'add-cutting') {
      setAddCuttingChartName(cleanName);
    } else {
      setSelectedChartName(cleanName);
    }
    setIsCreateChartOpen(false);
    setNewChartName('');
  };

  const handleDeleteChart = () => {
    if (!isSuperAdmin || !activeChart) return;
    if (window.confirm(`Are you sure you want to delete the chart "${activeChart.name}"? All its logs and amounts will be permanently deleted.`)) {
      deleteChartMutation.mutate(activeChart.id);
    }
  };

  // --- Actions & Submit Handlers ---
  const getResolvedTargetsForSingleNum = (numInput: string, useFamily: boolean, viewType: string = activeView): string[] | null => {
    const num = numInput.replace(/\s+/g, '');
    let keyNum = num;
    let targetNumbers: string[] = [];

    const setErrorMsg = (msg: string) => {
      if (activeView === 'add-cutting') {
        setAddCuttingError(msg);
      } else {
        setFormError(msg);
      }
    };

    if (viewType === 'panna') {
      const spdpMatch = numInput.trim().match(/^(\d+)\s*(sp|dp)$/i);
      if (spdpMatch) {
        const digit = spdpMatch[1];
        const type = spdpMatch[2].toLowerCase() as 'sp' | 'dp';
        targetNumbers = getSpDpPannasForDigit(digit, type);
        if (targetNumbers.length === 0) {
          setErrorMsg(`Invalid digit for ${type.toUpperCase()}: ${digit}. Must be 0-9.`);
          return null;
        }
      } else {
        if (num.length !== 3 || !VALID_PANNAS.has(num)) {
          setErrorMsg(`Invalid 3-digit number: ${num}. Must exist in the 220 Family.`);
          return null;
        }
        targetNumbers = useFamily ? getFamilyMembers(num) : [num];
      }
    } else if (viewType === 'jodi') {
      if (num.length !== 2 || !/^\d{2}$/.test(num)) {
        setErrorMsg(`Invalid Jodi: ${num}. Must be a 2-digit number from 00 to 99.`);
        return null;
      }
      targetNumbers = useFamily ? getJodiFamilyMembers(num) : [num];
    } else if (viewType === 'sp') {
      const spdpMatch = numInput.trim().match(/^(\d+)\s*(sp|dp)$/i);
      const digit = spdpMatch ? spdpMatch[1] : num;
      const type = spdpMatch ? (spdpMatch[2].toLowerCase() as 'sp' | 'dp') : 'sp';
      
      targetNumbers = getSpDpPannasForDigit(digit, type);
      if (targetNumbers.length === 0) {
        setErrorMsg(`Invalid SP Digit: ${digit}. Must be a single digit from 0 to 9.`);
        return null;
      }
    } else if (viewType === 'dp') {
      const spdpMatch = numInput.trim().match(/^(\d+)\s*(sp|dp)$/i);
      const digit = spdpMatch ? spdpMatch[1] : num;
      const type = spdpMatch ? (spdpMatch[2].toLowerCase() as 'sp' | 'dp') : 'dp';
      
      targetNumbers = getSpDpPannasForDigit(digit, type);
      if (targetNumbers.length === 0) {
        setErrorMsg(`Invalid DP Digit: ${digit}. Must be a single digit from 0 to 9.`);
        return null;
      }
    } else if (viewType === 'sutta') {
      if (num.length !== 1 || !/^\d$/.test(num)) {
        setErrorMsg(`Invalid Sutta Digit: ${num}. Must be a single digit from 0 to 9.`);
        return null;
      }
      keyNum = 'SU' + num;
      targetNumbers = useFamily ? getSingleFamilyMembers(num).map(d => 'SU' + d) : [keyNum];
    } else if (viewType === 'mpsp') {
      const digits = num.split('');
      const uniqueDigits = Array.from(new Set(digits));
      if (digits.length < 3 || digits.length > 9 || uniqueDigits.length !== digits.length || !/^\d+$/.test(num)) {
        setErrorMsg('Invalid Motor digits. Must be between 3 and 9 unique digits.');
        return null;
      }
      const sortedDigits = sortMatkaDigits(uniqueDigits);
      keyNum = 'MPSP_' + sortedDigits;
      targetNumbers = [keyNum];
    } else if (viewType === 'mpdp') {
      const digits = num.split('');
      const uniqueDigits = Array.from(new Set(digits));
      if (digits.length < 3 || digits.length > 9 || uniqueDigits.length !== digits.length || !/^\d+$/.test(num)) {
        setErrorMsg('Invalid Motor digits. Must be between 3 and 9 unique digits.');
        return null;
      }
      const sortedDigits = sortMatkaDigits(uniqueDigits);
      keyNum = 'MPDP_' + sortedDigits;
      targetNumbers = [keyNum];
    } else if (viewType === 'sangam') {
      const isSangamValid = /^\d{3}-\d{2}-\d{3}$/.test(num);
      if (!isSangamValid) {
        setErrorMsg('Invalid Sangam format. Use Panna-Jodi-Panna (e.g. 123-54-450).');
        return null;
      }
      const parts = num.split('-');
      const p1 = parts[0];
      const p2 = parts[2];
      if (!VALID_PANNAS.has(p1)) {
        setErrorMsg(`Invalid First Panna: ${p1}. Must exist in the 220 Family Chart.`);
        return null;
      }
      if (!VALID_PANNAS.has(p2)) {
        setErrorMsg(`Invalid Second Panna: ${p2}. Must exist in the 220 Family Chart.`);
        return null;
      }
      keyNum = 'SGM_' + num;
      targetNumbers = [keyNum];
    } else if (viewType === 'chakwad') {
      const isChakwadFormat = /^(\d{3})(,\d{3})*-(\d)(,\d)*$/.test(num);
      if (!isChakwadFormat) {
        setErrorMsg('Invalid Chakwad format. Use Panna-Digit (e.g., 123-5), Panna-Digits (e.g., 123-5,6,4), or Pannas-Digits (e.g., 123,125-4,1).');
        return null;
      }
      const [pannasStr, digitsStr] = num.split('-');
      const pannaList = pannasStr.split(',').map(p => p.trim());
      const digitList = digitsStr.split(',').map(d => d.trim());

      for (const p of pannaList) {
        if (!VALID_PANNAS.has(p)) {
          setErrorMsg(`Invalid Panna: ${p}. Must exist in the 220 Family Chart.`);
          return null;
        }
      }

      targetNumbers = [];
      pannaList.forEach(p => {
        digitList.forEach(d => {
          targetNumbers.push('CHK_' + p + '-' + d);
        });
      });
    }

    return targetNumbers;
  };

  const handleProcessEntry = (
    numInput: string, 
    amtStrInput: string, 
    mode: 'ADD' | 'SUBTRACT' | 'SET',
    useFamily: boolean,
    isFromModal: boolean = false,
    viewType: string = activeView,
    targetChart: CuttingChartData = activeChart!,
    onSuccessCallback?: () => void
  ) => {
    setFormError('');
    setAddCuttingError('');
    let num = numInput.replace(/\s+/g, '');
    let amtStr = amtStrInput.trim();

    const setErrorMsg = (msg: string) => {
      if (activeView === 'add-cutting') {
        setAddCuttingError(msg);
      } else {
        setFormError(msg);
      }
    };

    // 1. Hyphen parsing (e.g. "123-500" or "128-5-500")
    if (!isFromModal && num.includes('-')) {
      if (viewType === 'sangam') {
        const parts = num.split('-');
        if (parts.length === 4 && /^\d+$/.test(parts[3])) {
          amtStr = parts[3];
          num = parts.slice(0, 3).join('-');
        }
      } else if (viewType === 'chakwad') {
        const lastIndex = num.lastIndexOf('-');
        const beforeHyphen = num.substring(0, lastIndex);
        const afterHyphen = num.substring(lastIndex + 1);
        if (beforeHyphen.includes('-') && /^\d+$/.test(afterHyphen)) {
          amtStr = afterHyphen;
          num = beforeHyphen;
        }
      } else {
        const lastIndex = num.lastIndexOf('-');
        const afterHyphen = num.substring(lastIndex + 1);
        if (/^\d+(\.\d+)?$/.test(afterHyphen)) {
          amtStr = afterHyphen;
          num = num.substring(0, lastIndex);
        }
      }
    }

    // 2. Validate amount
    let amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return false;
    }

    // 3. Apply percentage scaling for entry log form
    if (!isFromModal) {
      amt = Math.round(amt * (percentage / 100));
    }

    const rawNumbers = num.split(',').map(n => n.trim()).filter(Boolean);
    const isChakwad = viewType === 'chakwad';

    const runMutation = (keyNumber: string, targets: string[]) => {
      logEntryMutation.mutate({
        chartId: targetChart.id,
        data: {
          number: keyNumber,
          amount: amt,
          type: mode,
          is_family: useFamily,
          affected_numbers: targets
        }
      }, {
        onSuccess: () => {
          if (!isFromModal) {
            setEntryNumber('');
            setEntryAmount('');
          }
          if (onSuccessCallback) {
            onSuccessCallback();
          }
        }
      });
    };

    if (rawNumbers.length > 1 && !isChakwad) {
      let combinedTargets: string[] = [];
      for (const rawNum of rawNumbers) {
        const resolved = getResolvedTargetsForSingleNum(rawNum, useFamily, viewType);
        if (!resolved) return false;
        combinedTargets.push(...resolved);
      }
      const uniqueTargets = Array.from(new Set(combinedTargets));
      runMutation(num, uniqueTargets);
      return true;
    } else {
      const resolved = getResolvedTargetsForSingleNum(num, useFamily, viewType);
      if (!resolved) return false;

      let keyNum = num;
      if (viewType === 'sp' && !num.toLowerCase().endsWith('sp')) {
        keyNum = num + ' sp';
      } else if (viewType === 'dp' && !num.toLowerCase().endsWith('dp')) {
        keyNum = num + ' dp';
      } else if (!isChakwad && resolved.length === 1) {
        keyNum = resolved[0];
      }
      runMutation(keyNum, resolved);
      return true;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessEntry(entryNumber, entryAmount, entryMode, applyFamily);
  };

  const handleAddCuttingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCuttingSuccess('');
    setAddCuttingError('');
    setAddCuttingLoading(true);

    try {
      const groupVal = addCuttingGroup;
      const dateVal = addCuttingDate;
      const sessionVal = addCuttingSession;
      const chartNameVal = addCuttingChartName.trim();
      const typeVal = addCuttingType;
      let numInput = addCuttingNumber.replace(/\s+/g, '');
      let amtInput = addCuttingAmount.trim();

      if (!chartNameVal) {
        throw new Error('Please select or create a Chart Name.');
      }

      // 1. Hyphen parsing for amount in the number input
      if (numInput.includes('-')) {
        if (typeVal === 'sangam') {
          const parts = numInput.split('-');
          if (parts.length === 4 && /^\d+$/.test(parts[3])) {
            amtInput = parts[3];
            numInput = parts.slice(0, 3).join('-');
          }
        } else if (typeVal === 'chakwad') {
          const lastIndex = numInput.lastIndexOf('-');
          const beforeHyphen = numInput.substring(0, lastIndex);
          const afterHyphen = numInput.substring(lastIndex + 1);
          if (beforeHyphen.includes('-') && /^\d+$/.test(afterHyphen)) {
            amtInput = afterHyphen;
            numInput = beforeHyphen;
          }
        } else if (typeVal !== 'mpsp' && typeVal !== 'mpdp' && typeVal !== 'motor spdp') {
          const lastIndex = numInput.lastIndexOf('-');
          const afterHyphen = numInput.substring(lastIndex + 1);
          if (/^\d+(\.\d+)?$/.test(afterHyphen)) {
            amtInput = afterHyphen;
            numInput = numInput.substring(0, lastIndex);
          }
        }
      }

      const amt = parseInt(amtInput, 10);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Please enter a valid amount greater than 0.');
      }

      // Map "family", "sp", "dp" type to "panna" chart type
      const targetChartType = (typeVal === 'family' || typeVal === 'sp' || typeVal === 'dp') ? 'panna' : typeVal;
      const useFamily = typeVal === 'family' || addCuttingFamily;

      // Handle batch input (comma-separated list of numbers)
      const rawNumItems = typeVal === 'chakwad' ? [numInput] : numInput.split(',').filter(Boolean);
      if (rawNumItems.length === 0) {
        throw new Error('Please enter at least one number.');
      }

      // If motor spdp combo, log to both mpsp and mpdp.
      const chartTypesToLog = targetChartType === 'motor spdp' ? ['mpsp', 'mpdp'] : [targetChartType];

      for (const currentType of chartTypesToLog) {
        // Fetch or create the chart
        const chart = await cuttingApi.getOrCreateChart(
          groupVal,
          dateVal,
          currentType,
          sessionVal,
          chartNameVal
        );

        // Resolve targets for each number item
        let combinedTargets: string[] = [];
        for (const item of rawNumItems) {
          const resolvedType = typeVal === 'family' ? 'panna' : typeVal;
          const resolved = getResolvedTargetsForSingleNum(item, useFamily, resolvedType);
          if (!resolved) {
            // Error is already set in state inside getResolvedTargetsForSingleNum
            setAddCuttingLoading(false);
            return;
          }
          combinedTargets.push(...resolved);
        }
        const uniqueTargets = Array.from(new Set(combinedTargets));

        // Call the log entry API
        let keyNumber = rawNumItems.join(',');
        if (typeVal === 'sp' && !keyNumber.toLowerCase().endsWith('sp')) {
          keyNumber = keyNumber + ' sp';
        } else if (typeVal === 'dp' && !keyNumber.toLowerCase().endsWith('dp')) {
          keyNumber = keyNumber + ' dp';
        }
        
        await cuttingApi.logEntry(chart.id, {
          number: keyNumber,
          amount: amt,
          type: 'ADD',
          is_family: useFamily,
          affected_numbers: uniqueTargets
        });
      }

      setAddCuttingSuccess('Added successfully!');
      setAddCuttingNumber('');
      setAddCuttingAmount('');
      // Refetch the recent logs list
      refetchRecentLogs();
      // Invalidate queries to refresh chart data
      queryClient.invalidateQueries({ queryKey: ['cuttingChart'] });
      queryClient.invalidateQueries({ queryKey: ['cuttingChartNames'] });
      setTimeout(() => {
        addCuttingNumberInputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      setAddCuttingError(err?.response?.data?.detail || err?.message || 'Failed to add entry.');
    } finally {
      setAddCuttingLoading(false);
    }
  };

  const handleQuickPasteAddCutting = async () => {
    setAddCuttingSuccess('');
    setAddCuttingError('');
    if (!quickPasteText.trim()) return;

    const groupVal = addCuttingGroup;
    const dateVal = addCuttingDate;
    const sessionVal = addCuttingSession;
    const chartNameVal = addCuttingChartName.trim();
    const typeVal = addCuttingType;

    if (!chartNameVal) {
      setAddCuttingError('Please select or create a Chart Name first.');
      return;
    }

    const lines = quickPasteText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setQuickPasteLoading(true);

    try {
      // Map "family", "sp", "dp" type to "panna" chart type
      const targetChartType = (typeVal === 'family' || typeVal === 'sp' || typeVal === 'dp') ? 'panna' : typeVal;
      const useFamily = typeVal === 'family' || addCuttingFamily;
      const chartTypesToLog = targetChartType === 'motor spdp' ? ['mpsp', 'mpdp'] : [targetChartType];

      // Fetch or create all charts first to avoid repeated calls
      const chartsMap: Record<string, CuttingChartData> = {};
      for (const currentType of chartTypesToLog) {
        chartsMap[currentType] = await cuttingApi.getOrCreateChart(
          groupVal,
          dateVal,
          currentType,
          sessionVal,
          chartNameVal
        );
      }

      let parsedCount = 0;
      let errorLines: string[] = [];

      for (const line of lines) {
        let numInput = line.replace(/\s+/g, '');
        let amtInput = '';

        // Try parsing hyphen amount
        if (numInput.includes('-')) {
          if (typeVal === 'sangam') {
            const parts = numInput.split('-');
            if (parts.length === 4 && /^\d+$/.test(parts[3])) {
              amtInput = parts[3];
              numInput = parts.slice(0, 3).join('-');
            }
          } else if (typeVal === 'chakwad') {
            const lastIndex = numInput.lastIndexOf('-');
            const beforeHyphen = numInput.substring(0, lastIndex);
            const afterHyphen = numInput.substring(lastIndex + 1);
            if (beforeHyphen.includes('-') && /^\d+$/.test(afterHyphen)) {
              amtInput = afterHyphen;
              numInput = beforeHyphen;
            }
          } else if (typeVal !== 'mpsp' && typeVal !== 'mpdp' && typeVal !== 'motor spdp') {
            const lastIndex = numInput.lastIndexOf('-');
            const afterHyphen = numInput.substring(lastIndex + 1);
            if (/^\d+(\.\d+)?$/.test(afterHyphen)) {
              amtInput = afterHyphen;
              numInput = numInput.substring(0, lastIndex);
            }
          }
        }

        // If no amount in hyphen, fallback to input field amount
        if (!amtInput) {
          amtInput = addCuttingAmount.trim();
        }

        const amt = parseInt(amtInput, 10);
        if (isNaN(amt) || amt <= 0) {
          errorLines.push(`"${line}" (invalid amount)`);
          continue;
        }

        const rawNumItems = typeVal === 'chakwad' ? [numInput] : numInput.split(',').filter(Boolean);
        if (rawNumItems.length === 0) {
          errorLines.push(`"${line}" (no digits)`);
          continue;
        }

        let combinedTargets: string[] = [];
        let resolveFailed = false;
        for (const item of rawNumItems) {
          const resolvedType = typeVal === 'family' ? 'panna' : typeVal;
          const resolved = getResolvedTargetsForSingleNum(item, useFamily, resolvedType);
          if (!resolved) {
            resolveFailed = true;
            break;
          }
          combinedTargets.push(...resolved);
        }

        if (resolveFailed) {
          errorLines.push(`"${line}" (invalid digits)`);
          continue;
        }

        const uniqueTargets = Array.from(new Set(combinedTargets));

        for (const currentType of chartTypesToLog) {
          const chart = chartsMap[currentType];
          let keyNumber = rawNumItems.join(',');
          if (typeVal === 'sp' && !keyNumber.toLowerCase().endsWith('sp')) {
            keyNumber = keyNumber + ' sp';
          } else if (typeVal === 'dp' && !keyNumber.toLowerCase().endsWith('dp')) {
            keyNumber = keyNumber + ' dp';
          }

          await cuttingApi.logEntry(chart.id, {
            number: keyNumber,
            amount: amt,
            type: 'ADD',
            is_family: useFamily,
            affected_numbers: uniqueTargets
          });
        }
        parsedCount++;
      }

      if (parsedCount > 0) {
        setAddCuttingSuccess(`Successfully pasted and logged ${parsedCount} entries!`);
        setQuickPasteText('');
        refetchRecentLogs();
        queryClient.invalidateQueries({ queryKey: ['cuttingChart'] });
        queryClient.invalidateQueries({ queryKey: ['cuttingChartNames'] });
      }

      if (errorLines.length > 0) {
        setAddCuttingError(`Failed to parse some lines: ${errorLines.join(', ')}`);
      }
    } catch (err: any) {
      setAddCuttingError(err?.response?.data?.detail || err?.message || 'Failed to process paste entries.');
    } finally {
      setQuickPasteLoading(false);
    }
  };

  const handleQuickPasteSidebar = async () => {
    setFormError('');
    if (!quickPasteText.trim() || !activeChart) return;

    const lines = quickPasteText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setQuickPasteLoading(true);

    try {
      let parsedCount = 0;
      let errorLines: string[] = [];

      for (const line of lines) {
        let numInput = line.replace(/\s+/g, '');
        let amtInput = '';

        if (numInput.includes('-')) {
          if (activeView === 'sangam') {
            const parts = numInput.split('-');
            if (parts.length === 4 && /^\d+$/.test(parts[3])) {
              amtInput = parts[3];
              numInput = parts.slice(0, 3).join('-');
            }
          } else if (activeView === 'chakwad') {
            const lastIndex = numInput.lastIndexOf('-');
            const beforeHyphen = numInput.substring(0, lastIndex);
            const afterHyphen = numInput.substring(lastIndex + 1);
            if (beforeHyphen.includes('-') && /^\d+$/.test(afterHyphen)) {
              amtInput = afterHyphen;
              numInput = beforeHyphen;
            }
          } else {
            const lastIndex = numInput.lastIndexOf('-');
            const afterHyphen = numInput.substring(lastIndex + 1);
            if (/^\d+(\.\d+)?$/.test(afterHyphen)) {
              amtInput = afterHyphen;
              numInput = numInput.substring(0, lastIndex);
            }
          }
        }

        if (!amtInput) {
          amtInput = entryAmount.trim();
        }

        let amt = parseFloat(amtInput);
        if (isNaN(amt) || amt <= 0) {
          errorLines.push(`"${line}" (invalid amount)`);
          continue;
        }

        amt = Math.round(amt * (percentage / 100));

        const rawNumItems = activeView === 'chakwad' ? [numInput] : numInput.split(',').filter(Boolean);
        if (rawNumItems.length === 0) {
          errorLines.push(`"${line}" (no digits)`);
          continue;
        }

        let combinedTargets: string[] = [];
        let resolveFailed = false;
        for (const item of rawNumItems) {
          const resolved = getResolvedTargetsForSingleNum(item, applyFamily, activeView);
          if (!resolved) {
            resolveFailed = true;
            break;
          }
          combinedTargets.push(...resolved);
        }

        if (resolveFailed) {
          errorLines.push(`"${line}" (invalid digits)`);
          continue;
        }

        const uniqueTargets = Array.from(new Set(combinedTargets));

        let keyNumber = rawNumItems.join(',');
        if ((activeView as string) === 'sp' && !keyNumber.toLowerCase().endsWith('sp')) {
          keyNumber = keyNumber + ' sp';
        } else if ((activeView as string) === 'dp' && !keyNumber.toLowerCase().endsWith('dp')) {
          keyNumber = keyNumber + ' dp';
        } else if (activeView !== 'chakwad' && uniqueTargets.length === 1) {
          keyNumber = uniqueTargets[0];
        }

        await cuttingApi.logEntry(activeChart.id, {
          number: keyNumber,
          amount: amt,
          type: entryMode,
          is_family: applyFamily,
          affected_numbers: uniqueTargets
        });
        parsedCount++;
      }

      if (parsedCount > 0) {
        setQuickPasteText('');
        queryClient.invalidateQueries({ queryKey: ['cuttingChart', selectedGroupId, selectedDate] });
        queryClient.invalidateQueries({ queryKey: ['cuttingChartNames', selectedGroupId, selectedDate] });
      }

      if (errorLines.length > 0) {
        setFormError(`Failed to parse some lines: ${errorLines.join(', ')}`);
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || err?.message || 'Failed to process paste entries.');
    } finally {
      setQuickPasteLoading(false);
    }
  };

  const handleCellModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;
    
    let baseNum = selectedCell;
    if (selectedCell.startsWith('SU')) {
      baseNum = selectedCell.substring(2);
    } else if (selectedCell.startsWith('MPSP_')) {
      baseNum = selectedCell.replace('MPSP_', '');
    } else if (selectedCell.startsWith('MPDP_')) {
      baseNum = selectedCell.replace('MPDP_', '');
    } else if (selectedCell.startsWith('SGM_')) {
      baseNum = selectedCell.replace('SGM_', '');
    } else if (selectedCell.startsWith('CHK_')) {
      baseNum = selectedCell.replace('CHK_', '');
    } else if (selectedCell.startsWith('S') || selectedCell.startsWith('D')) {
      baseNum = selectedCell.substring(1);
    }
    
    const success = handleProcessEntry(baseNum, cellModalAmount, cellModalMode, cellModalApplyFamily, true);
    if (success) {
      setSelectedCell(null);
      setCellModalAmount('');
    }
  };

  const handleUndoLog = (logId: number) => {
    if (!isSuperAdmin) return;
    if (window.confirm('Are you sure you want to undo this entry? This will revert the logged amount.')) {
      deleteLogMutation.mutate(logId);
    }
  };

  const handleResetChart = () => {
    if (!isSuperAdmin || !activeChart) return;
    if (window.confirm(`Are you sure you want to clear ALL logged amounts in the current chart "${activeChart?.name || ''}"? This cannot be undone.`)) {
      resetChartMutation.mutate(activeChart.id);
    }
  };

  const handleCellClick = (num: string) => {
    setSelectedCell(num);
    setCellModalMode('ADD');
    setCellModalAmount('');
  };

  const handlePrint = () => {
    if (!activeChart) return;
    const originalTitle = document.title;
    const viewName = 
      activeView === 'panna' ? '220 Panna Chart' :
      activeView === 'jodi' ? 'Jodi Chart' :
      activeView === 'sutta' ? 'Sutta Chart' :
      activeView === 'mpsp' ? 'MPSP Chart' :
      activeView === 'mpdp' ? 'MPDP Chart' :
      activeView === 'sangam' ? 'Sangam Chart' : 'Chakwad Chart';
    
    document.title = `${activeChart?.name || ''} - ${viewName}`;
    window.print();
    
    // Restore original title
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const handleExportPDF = () => {
    if (!activeChart) return;
    const originalTitle = document.title;
    const viewName = 
      activeView === 'panna' ? '220 Panna Chart' :
      activeView === 'jodi' ? 'Jodi Chart' :
      activeView === 'sutta' ? 'Sutta Chart' :
      activeView === 'mpsp' ? 'MPSP Chart' :
      activeView === 'mpdp' ? 'MPDP Chart' :
      activeView === 'sangam' ? 'Sangam Chart' : 'Chakwad Chart';
    
    document.title = `${activeChart?.name || ''} - ${viewName}`;
    setShowPdfHint(true);
    
    // Give state/DOM time to update, then trigger print dialog
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setShowPdfHint(false);
    }, 300);
  };

  const handleExportAllPDF = async () => {
    if (selectedGroupId === null || !activeChart) return;
    setIsFetchingAllCharts(true);
    setFormError('');
    try {
      const data = await cuttingApi.getAllTypes(selectedGroupId, selectedDate, selectedSession);
      // Filter out family chart (type 'panna') as requested
      const filtered = data.filter(c => c.chart_type !== 'panna');
      setAllChartsToPrint(filtered);
      setShowPdfHint(true);
      
      // Give state/DOM time to render the print compilation container, then trigger print dialog
      setTimeout(() => {
        const originalTitle = document.title;
        document.title = `${(activeChart?.name || '').split('(')[0].trim()} - All Charts`;
        window.print();
        document.title = originalTitle;
        setShowPdfHint(false);
        setAllChartsToPrint(null);
      }, 800);
    } catch (err: any) {
      setFormError('Failed to fetch all chart data for PDF export.');
    } finally {
      setIsFetchingAllCharts(false);
    }
  };

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    setSearchParams(params);
  };

  return (
    <div className={`space-y-6 ${allChartsToPrint ? 'print-all-active' : ''}`}>
      {/* CSS Injected specifically for clean grid printing */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide side navigation header layouts */
          aside, header, .no-print, .controls-panel, .logs-panel {
            display: none !important;
          }
          /* Expand content fully */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .print-all-active .print-area {
            display: none !important;
          }
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-all-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 99999 !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .print-area table, .print-all-container table {
            width: 100% !important;
            table-layout: fixed !important;
          }
          .print-area th, .print-area td, .print-all-container th, .print-all-container td {
            font-size: 10px !important;
            padding: 3px 1px !important;
            background-color: #fef08a !important; /* Force printable light yellow color */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 1px solid black !important;
          }
          /* Keep the red highlight readable in grayscale or color prints */
          .print-area .red-cell, .print-all-container .red-cell {
            background-color: #ef4444 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-area .print-red-cell {
            background-color: #fee2e2 !important;
            border: 2px solid #ef4444 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-area .print-green-cell {
            background-color: #d1fae5 !important;
            border: 1px solid #10b981 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-title {
            background-color: #facc15 !important;
            color: #b91c1c !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 20px !important;
            padding: 10px !important;
            border: 2px solid black !important;
          }
        }
      `}</style>

      {/* PDF Export Floating Tutorial Toast */}
      {showPdfHint && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl flex items-center justify-between shadow-sm no-print animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <FileDown className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm">Generating Vector PDF...</p>
              <p className="text-xs text-blue-600 mt-0.5">
                In the print dialog, set the <strong>Destination</strong> to <strong>"Save as PDF"</strong> to download the file.
              </p>
            </div>
          </div>
          <button onClick={() => setShowPdfHint(false)} className="text-blue-400 hover:text-blue-600 font-bold text-sm cursor-pointer p-1">
            ✕
          </button>
        </div>
      )}

      {/* Header and statistics banner */}
      {activeView !== 'add-cutting' && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Scissors className="h-6 w-6 text-blue-600" />
              Cutting Panel
            </h2>
            <p className="text-slate-500 mt-1">Manage and audit limits on the 220 Family Chart grid.</p>
          </div>
          
          {/* Toolbar Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Group selector dropdown */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Group:</span>
              <SearchableSelect
                value={selectedGroupId || ''}
                onChange={(val) => {
                  if (val === 'all') {
                    setSelectedGroupId('all');
                  } else {
                    setSelectedGroupId(parseInt(val, 10));
                  }
                }}
                options={[
                  { value: 'all', label: 'All Groups' },
                  ...groups.map((g: any) => ({ value: g.id, label: g.name }))
                ]}
              />
            </div>

            {/* Chart Name selector dropdown */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chart Name:</span>
              <SearchableSelect
                value={selectedChartName}
                onChange={(val) => {
                  setSelectedChartName(val);
                }}
                options={[
                  ...chartNames.map((name) => ({ value: name, label: name })),
                  ...(selectedChartName && !chartNames.includes(selectedChartName) ? [{ value: selectedChartName, label: selectedChartName }] : [])
                ]}
                placeholder={chartNames.length === 0 ? "Select or Create Chart" : "Select Chart"}
                createOptionLabel="+ Create New..."
                onCreateOption={() => {
                  setIsCreateChartOpen(true);
                  setNewChartName('');
                  setChartError('');
                }}
              />
            </div>

            {/* Session selector dropdown */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Session:</span>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 border-none outline-none focus:ring-0 cursor-pointer p-0 pr-6"
              >
                <option value="Open">Open</option>
                <option value="Close">Close</option>
              </select>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 border-none outline-none focus:ring-0 cursor-pointer p-0"
              />
            </div>

            {/* Date presets */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handleSetToday}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedDate === getLocalDateString() ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-white/40'
                }`}
              >
                Today
              </button>
              <button
                onClick={handleSetYesterday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-white/40 cursor-pointer"
              >
                Yesterday
              </button>
              <button
                onClick={handleSetPreviousDate}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-white/40 cursor-pointer"
                title="Go back 1 day"
              >
                Prev
              </button>
            </div>

            {/* Chart action buttons */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handleOpenRenameChart}
                className="p-1.5 hover:bg-white hover:text-amber-600 rounded-lg text-slate-600 transition shadow-none hover:shadow-sm cursor-pointer"
                title="Rename Current Chart Name"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              {isSuperAdmin && (
                <button
                  onClick={handleDeleteChart}
                  className="p-1.5 hover:bg-white hover:text-red-600 rounded-lg text-slate-600 transition shadow-none hover:shadow-sm cursor-pointer"
                  title="Delete Current Chart"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button variant="secondary" onClick={handleExportAllPDF} className="flex items-center gap-2" isLoading={isFetchingAllCharts}>
              <FileDown className="h-4 w-4 text-orange-500" />
              <span>Export All PDF</span>
            </Button>
            <Button variant="secondary" onClick={handleExportPDF} className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-red-500" />
              <span>Export PDF</span>
            </Button>
            <Button variant="secondary" onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              <span>Print Chart</span>
            </Button>
            {isSuperAdmin && (
              <Button variant="danger" onClick={handleResetChart} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>Reset Grid</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* View Switcher Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex flex-wrap items-center gap-1.5 no-print">
        {[
          {key: 'panna', label: 'Family Chart'},
          { key: 'jodi', label: 'Jodi Chart (00-99)' },
          { key: 'sutta', label: 'Sutta (0-9)' },
          { key: 'mpsp', label: 'Motor SP (MPSP)' },
          { key: 'mpdp', label: 'Motor DP (MPDP)' },
          { key: 'sangam', label: 'Sangam' },
          { key: 'chakwad', label: 'Chakwad' },
          { key: 'analysis', label: 'Panna P&L Analysis' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleViewChange(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeView === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Widget cards */}
      {activeView !== 'add-cutting' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Volume Logged</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalCuttingVolume)}</h3>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div 
            onClick={() => {
              if (activeView !== 'analysis' && overLimitCount > 0) {
                setHighlightOverLimitOnly(!highlightOverLimitOnly);
              }
            }}
            className={`bg-white rounded-2xl p-6 border shadow-sm flex items-center justify-between transition-all duration-200 select-none ${
              activeView !== 'analysis' && overLimitCount > 0 ? 'cursor-pointer hover:bg-slate-50/50' : ''
            } ${
              activeView === 'analysis'
                ? (Object.keys(amounts).filter(num => {
                    const pannaType = getPannaType(num);
                    let multiplier = 0;
                    if (pannaType === 'SP') multiplier = spPayout / 10;
                    else if (pannaType === 'DP') multiplier = dpPayout / 10;
                    else multiplier = tpPayout / 10;
                    const winningAmount = (amounts[num] || 0) * multiplier;
                    const totalVolumeThreshold = isTotalVolumeOverridden 
                      ? (parseFloat(analysisTotalVolumeInput) || 0) 
                      : totalCuttingVolume;
                    return winningAmount > totalVolumeThreshold;
                  }).length) > 0 ? 'border-red-500 bg-red-50/10' : 'border-slate-100'
                : highlightOverLimitOnly 
                  ? 'border-red-500 bg-red-50/20 ring-2 ring-red-100' 
                  : 'border-slate-100'
            }`}
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                {activeView === 'analysis'
                  ? 'Overloaded Pannas'
                  : highlightOverLimitOnly ? 'Filtering: Over Limit' : 'Numbers Over Limit'}
              </p>
              <h3 className={`text-2xl font-bold ${
                (activeView === 'analysis'
                  ? Object.keys(amounts).filter(num => {
                      const pannaType = getPannaType(num);
                      let multiplier = 0;
                      if (pannaType === 'SP') multiplier = spPayout / 10;
                      else if (pannaType === 'DP') multiplier = dpPayout / 10;
                      else multiplier = tpPayout / 10;
                      const winningAmount = (amounts[num] || 0) * multiplier;
                      const totalVolumeThreshold = isTotalVolumeOverridden 
                        ? (parseFloat(analysisTotalVolumeInput) || 0) 
                        : totalCuttingVolume;
                      return winningAmount > totalVolumeThreshold;
                    }).length
                  : overLimitCount) > 0 
                    ? 'text-red-600 animate-pulse' 
                    : 'text-slate-800'
              }`}>
                {activeView === 'analysis'
                  ? Object.keys(amounts).filter(num => {
                      const pannaType = getPannaType(num);
                      let multiplier = 0;
                      if (pannaType === 'SP') multiplier = spPayout / 10;
                      else if (pannaType === 'DP') multiplier = dpPayout / 10;
                      else multiplier = tpPayout / 10;
                      const winningAmount = (amounts[num] || 0) * multiplier;
                      const totalVolumeThreshold = isTotalVolumeOverridden 
                        ? (parseFloat(analysisTotalVolumeInput) || 0) 
                        : totalCuttingVolume;
                      return winningAmount > totalVolumeThreshold;
                    }).length
                  : overLimitCount}
              </h3>
            </div>
            <div className={`p-4 rounded-xl transition-all duration-200 ${
              activeView === 'analysis'
                ? (Object.keys(amounts).filter(num => {
                    const pannaType = getPannaType(num);
                    let multiplier = 0;
                    if (pannaType === 'SP') multiplier = spPayout / 10;
                    else if (pannaType === 'DP') multiplier = dpPayout / 10;
                    else multiplier = tpPayout / 10;
                    const winningAmount = (amounts[num] || 0) * multiplier;
                    const totalVolumeThreshold = isTotalVolumeOverridden 
                      ? (parseFloat(analysisTotalVolumeInput) || 0) 
                      : totalCuttingVolume;
                    return winningAmount > totalVolumeThreshold;
                  }).length) > 0 ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-500'
                : highlightOverLimitOnly 
                  ? 'bg-red-500 text-white' 
                  : overLimitCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center space-y-3">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide block">
              Set Threshold Limits (INR)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-600 block uppercase">Green</label>
                <div className="relative">
                  <span className="absolute left-2 top-2.5 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={greenLimitInput}
                    onChange={(e) => setGreenLimitInput(e.target.value)}
                    onBlur={handleLimitsBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLimitsBlur();
                      }
                    }}
                    className="w-full pl-5 pr-1 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-500 block uppercase">Yellow</label>
                <div className="relative">
                  <span className="absolute left-2 top-2.5 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={yellowLimitInput}
                    onChange={(e) => setYellowLimitInput(e.target.value)}
                    onBlur={handleLimitsBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLimitsBlur();
                      }
                    }}
                    className="w-full pl-5 pr-1 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-red-600 block uppercase">Red</label>
                <div className="relative">
                  <span className="absolute left-2 top-2.5 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    onBlur={handleLimitsBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLimitsBlur();
                      }
                    }}
                    className="w-full pl-5 pr-1 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'add-cutting' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start no-print">
          {/* Form Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Scissors className="h-6 w-6 text-blue-600 animate-pulse" />
                New Cutting Log
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Log single or batch cutting bets directly to the system.
              </p>
            </div>

            {addCuttingSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{addCuttingSuccess}</span>
              </div>
            )}

            {addCuttingError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-2 text-sm font-semibold animate-fade-in">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <span>{addCuttingError}</span>
              </div>
            )}

            {/* Collapsible Chart Setup Card */}
            {(() => {
              const selectedGroupObj = groups?.find((g: any) => g.id === addCuttingGroup);
              const groupLabel = selectedGroupObj ? selectedGroupObj.name : addCuttingGroup === 'all' ? 'All Groups' : 'Select Group';
              return (
                <div className="border border-slate-100 rounded-2xl bg-slate-50/70 p-4 transition-all duration-300">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-slate-400">Group:</span> <strong className="text-slate-800">{groupLabel}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-400">Date:</span> <strong className="text-slate-800">{addCuttingDate}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-slate-400">Session:</span> <strong className="text-slate-800">{addCuttingSession}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-slate-400">Chart Name:</span> <strong className="text-slate-800">{addCuttingChartName || '(None)'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSetupExpanded(!isSetupExpanded)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-xl transition-all shadow-sm"
                    >
                      {isSetupExpanded ? 'Hide Settings' : 'Change Setup'}
                    </button>
                  </div>

                  {isSetupExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      {/* Group Select */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Group</label>
                        <SearchableSelect
                          value={addCuttingGroup}
                          onChange={(val) => {
                            setAddCuttingGroup(val === 'all' ? 'all' : parseInt(val, 10));
                          }}
                          options={[
                            { value: 'all', label: 'All Groups' },
                            ...groups.map((g: any) => ({ value: g.id, label: g.name }))
                          ]}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                        />
                      </div>

                      {/* Date Select */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                        <input
                          type="date"
                          value={addCuttingDate}
                          onChange={(e) => setAddCuttingDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                        />
                      </div>

                      {/* Session Select */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Session</label>
                        <select
                          value={addCuttingSession}
                          onChange={(e) => setAddCuttingSession(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                        >
                          <option value="Open">Open</option>
                          <option value="Close">Close</option>
                        </select>
                      </div>

                      {/* Chart Name Select */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Chart Name</label>
                        <SearchableSelect
                          value={addCuttingChartName}
                          onChange={(val) => {
                            setAddCuttingChartName(val);
                          }}
                          options={[
                            ...addCuttingChartNames.map((name) => ({ value: name, label: name })),
                            ...(addCuttingChartName && !addCuttingChartNames.includes(addCuttingChartName) ? [{ value: addCuttingChartName, label: addCuttingChartName }] : [])
                          ]}
                          placeholder={addCuttingChartNames.length === 0 ? "Select or Create Chart" : "Select Chart"}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                          createOptionLabel="+ Create New..."
                          onCreateOption={() => {
                            setIsCreateChartOpen(true);
                            setNewChartName('');
                            setChartError('');
                          }}
                        />
                      </div>

                      {/* Overall Threshold Limits */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Set Overall Limits (INR) for All Charts</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-600 block uppercase">Green</span>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                value={overallGreenLimitInput}
                                onChange={(e) => setOverallGreenLimitInput(e.target.value)}
                                onBlur={handleOverallLimitsBlur}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleOverallLimitsBlur();
                                  }
                                }}
                                className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-500 block uppercase">Yellow</span>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                value={overallYellowLimitInput}
                                onChange={(e) => setOverallYellowLimitInput(e.target.value)}
                                onBlur={handleOverallLimitsBlur}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleOverallLimitsBlur();
                                  }
                                }}
                                className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-red-600 block uppercase">Red</span>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                value={overallLimitInput}
                                onChange={(e) => setOverallLimitInput(e.target.value)}
                                onBlur={handleOverallLimitsBlur}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleOverallLimitsBlur();
                                  }
                                }}
                                className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-red-500/20 transition"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          These limits will apply to all chart types (Jodi, SP, DP, Sutta, etc.) for the current Group, Date, and Session.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleAddCuttingSubmit} className="space-y-6">
              {/* Interactive Chart Type Chips */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Chart Type</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'panna', label: 'Panna', bgActive: 'bg-blue-600 border-blue-600' },
                    { key: 'family', label: 'Family', bgActive: 'bg-indigo-600 border-indigo-600' },
                    { key: 'jodi', label: 'Jodi', bgActive: 'bg-emerald-600 border-emerald-600' },
                    { key: 'dp', label: 'DP', bgActive: 'bg-rose-600 border-rose-600' },
                    { key: 'sp', label: 'SP', bgActive: 'bg-sky-600 border-sky-600' },
                    { key: 'sutta', label: 'Sutta', bgActive: 'bg-teal-600 border-teal-600' },
                    { key: 'mpsp', label: 'Motor SP', bgActive: 'bg-purple-600 border-purple-600' },
                    { key: 'mpdp', label: 'Motor DP', bgActive: 'bg-violet-600 border-violet-600' },
                    { key: 'motor spdp', label: 'Motor SPDP', bgActive: 'bg-fuchsia-600 border-fuchsia-600' },
                    { key: 'sangam', label: 'Sangam', bgActive: 'bg-orange-600 border-orange-600' },
                    { key: 'chakwad', label: 'Chakwad', bgActive: 'bg-amber-600 border-amber-600' },
                  ].map((chip) => {
                    const isActive = addCuttingType === chip.key;
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => {
                          setAddCuttingType(chip.key);
                          setAddCuttingSuccess('');
                          setAddCuttingError('');
                          setTimeout(() => {
                            addCuttingNumberInputRef.current?.focus();
                          }, 50);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer ${
                          isActive
                            ? `${chip.bgActive} text-white shadow-md scale-105`
                            : 'border-slate-200 text-slate-600 bg-slate-50/50 hover:bg-slate-100'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Large Entry Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Number input */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-slate-700 flex justify-between items-center">
                    <span>
                      {addCuttingType === 'panna' || addCuttingType === 'family' ? '3-Digit Number (Panna)' :
                       addCuttingType === 'jodi' ? '2-Digit Number (Jodi)' :
                       addCuttingType === 'sp' ? 'Digit (SP 0-9)' :
                       addCuttingType === 'dp' ? 'Digit (DP 0-9)' :
                       addCuttingType === 'sutta' ? 'Digit (Sutta 0-9)' :
                       addCuttingType === 'mpsp' ? 'Motor Digits (MPSP 0-9)' :
                       addCuttingType === 'mpdp' ? 'Motor Digits (MPDP 0-9)' :
                       addCuttingType === 'motor spdp' ? 'Motor Digits (SPDP 0-9)' :
                       addCuttingType === 'sangam' ? 'Sangam (Panna-Jodi-Panna)' : 'Chakwad Digits (0-9)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">
                      Separate multiple by comma (,)
                    </span>
                  </label>
                  <input
                    ref={addCuttingNumberInputRef}
                    type="text"
                    value={addCuttingNumber}
                    onChange={(e) => setAddCuttingNumber(e.target.value)}
                    placeholder={
                      addCuttingType === 'panna' || addCuttingType === 'family' ? 'e.g. 128 or 128-100 or 128,129-100' :
                      addCuttingType === 'jodi' ? 'e.g. 25 or 25-100 or 25,26-100' :
                      addCuttingType === 'sp' ? 'e.g. 5 or 5-100' :
                      addCuttingType === 'dp' ? 'e.g. 2 or 2-100' :
                      addCuttingType === 'sutta' ? 'e.g. 5 or 5-100' :
                      addCuttingType === 'mpsp' ? 'e.g. 13579 or 13579-200' :
                      addCuttingType === 'mpdp' ? 'e.g. 1234 or 1234-500' :
                      addCuttingType === 'motor spdp' ? 'e.g. 1234 or 1234-500' :
                      addCuttingType === 'sangam' ? 'e.g. 123-54-450 or 123-54-450-100' : 
                      'e.g. 123-5 or 123-5,6,4 or 123,125-4,1'
                    }
                    required
                    className="w-full px-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-200 placeholder:text-slate-400"
                  />
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Amount (INR)</label>
                  <input
                    type="number"
                    value={addCuttingAmount}
                    onChange={(e) => setAddCuttingAmount(e.target.value)}
                    placeholder="e.g. 100"
                    required={!addCuttingNumber.includes('-')}
                    className="w-full px-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-200 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Quick Amount Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Amount Presets</label>
                <div className="flex flex-wrap gap-2">
                  {[100, 200, 500, 1000, 2000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setAddCuttingAmount(val.toString());
                        setAddCuttingSuccess('');
                        setAddCuttingError('');
                      }}
                      className="px-3.5 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition cursor-pointer hover:shadow-sm"
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditionally show Apply to Family (Cuts) for relevant types */}
              {['panna', 'jodi', 'sp', 'dp', 'sutta'].includes(addCuttingType) && (
                <div className="flex items-center space-x-2.5 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                  <input
                    type="checkbox"
                    id="addCuttingFamily"
                    checked={addCuttingFamily}
                    onChange={(e) => setAddCuttingFamily(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="addCuttingFamily" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    Apply to Family (Cuts)
                  </label>
                </div>
              )}

              <Button type="submit" className="w-full py-4 text-base font-bold flex items-center justify-center gap-2" isLoading={addCuttingLoading}>
                <Plus className="h-5 w-5" />
                <span>Add Entry</span>
              </Button>
            </form>

            {/* Quick Paste Area */}
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold flex items-center gap-1"><Clipboard className="h-4 w-4" /> Fast Paste Helper</span>
                <span className="flex items-center gap-1">
                  <span>Format: <code>Number-Amount</code> per line (e.g. <code>128-100</code>)</span>
                  <span className="cursor-help text-slate-400" title="Paste raw logs directly. E.g. writing 128-100 on a line translates to 128 logged with 100 amount. If you omit the amount (e.g. 128), it defaults to the Amount input field value above.">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </span>
              </div>
              <textarea
                className="w-full h-24 text-sm bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                placeholder="Paste entries here...&#10;128-100&#10;129-200&#10;130"
                value={quickPasteText}
                onChange={(e) => setQuickPasteText(e.target.value)}
              />
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full py-2.5 font-bold text-xs" 
                onClick={handleQuickPasteAddCutting}
                isLoading={quickPasteLoading}
              >
                Parse & Log Entries
              </Button>
            </div>
          </div>

          {/* Recent Added Logs Column */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              Recent Added Logs
            </h3>
            {recentTenantLogs.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No entries logged recently.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {recentTenantLogs.slice(0, 15).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-sm transition hover:bg-slate-100/50 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-800">
                          {formatLogNumber(log.number)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.type === 'ADD' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          log.type === 'SUBTRACT' ? 'bg-red-50 text-red-600 border border-red-100' : 
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {log.type}
                        </span>
                        {log.is_family && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                            Family Cuts
                          </span>
                        )}
                        <span className="font-extrabold text-blue-600">₹{log.amount}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px]">
                          {log.chart_name || 'Chart'}
                        </span>
                        <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px]">
                          {getChartTypeLabel(log.chart_type)}
                        </span>
                        <span>by {log.user_username || 'unknown'}</span>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleUndoLog(log.id)}
                        className="p-2 hover:bg-white text-slate-400 hover:text-red-500 rounded-xl border border-transparent hover:border-slate-200 transition cursor-pointer"
                        title="Undo Entry"
                        disabled={deleteLogMutation.isPending}
                      >
                        <Undo2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar Controls (Form Entry, Search, Log) */}
          <div className="lg:col-span-1 space-y-6 no-print">
            {/* Main Transaction Entry Form */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 controls-panel">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Scissors className="h-4.5 w-4.5 text-blue-500" /> Log Amount
              </h3>
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <Input
                  label={
                    activeView === 'panna' ? '3-Digit Number (Panna)' :
                    activeView === 'jodi' ? '2-Digit Number (Jodi)' :
                    activeView === 'sutta' ? 'Digit (Sutta 0-9)' :
                    activeView === 'mpsp' ? 'Motor Digits (MPSP 0-9)' :
                    activeView === 'mpdp' ? 'Motor Digits (MPDP 0-9)' :
                    activeView === 'sangam' ? 'Sangam (Panna-Digit / Pana-Pana)' : 'Chakwad Digits (0-9)'
                  }
                  type="text"
                  value={entryNumber}
                  onChange={(e) => setEntryNumber(e.target.value)}
                  placeholder={
                    activeView === 'panna' ? 'e.g. 128 or 128-500' :
                    activeView === 'jodi' ? 'e.g. 25 or 25-100' :
                    activeView === 'sutta' ? 'e.g. 5 or 5-200' :
                    activeView === 'mpsp' ? 'e.g. 13579 or 13579-200' :
                    activeView === 'mpdp' ? 'e.g. 1234 or 1234-500' :
                    activeView === 'sangam' ? 'e.g. 128-5 or 128-5-100' : 'e.g. 1234 or 1234-100'
                  }
                  required
                />

                <Input
                  label="Amount (INR)"
                  type="number"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="e.g. 500"
                  required={!entryNumber.includes('-')}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Mode</label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                    <button
                      type="button"
                      onClick={() => setEntryMode('ADD')}
                      className={`py-1.5 rounded-md cursor-pointer transition ${
                        entryMode === 'ADD' ? 'bg-white shadow-sm text-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('SUBTRACT')}
                      className={`py-1.5 rounded-md cursor-pointer transition ${
                        entryMode === 'SUBTRACT' ? 'bg-white shadow-sm text-red-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      Sub
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('SET')}
                      className={`py-1.5 rounded-md cursor-pointer transition ${
                        entryMode === 'SET' ? 'bg-white shadow-sm text-amber-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      Set
                    </button>
                  </div>
                </div>

                {/* Percentage Scaling field */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Percentage Scaling (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={percentage}
                      onChange={(e) => setPercentage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 50"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic leading-snug">
                    Scales logged amount. Example: 50% scales ₹500 to ₹250. You can type "123-500" in the number field for quick entry.
                  </p>
                </div>

                {/* Conditionally show Apply to Family (Cuts) */}
                {(activeView === 'panna' || activeView === 'jodi' || activeView === 'sutta') && (
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="applyFamily"
                      checked={applyFamily}
                      onChange={(e) => setApplyFamily(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="applyFamily" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                      Apply to Family (Cuts)
                    </label>
                  </div>
                )}

                <Button type="submit" className="w-full flex items-center justify-center gap-2" isLoading={logEntryMutation.isPending}>
                  <Plus className="h-4 w-4" />
                  <span>Record Entry</span>
                </Button>
              </form>

              {/* Separator line */}
              <div className="border-t border-slate-100 my-4" />

              {/* Quick Paste Area */}
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold flex items-center gap-1"><Clipboard className="h-3.5 w-3.5" /> Fast Paste Helper</span>
                  <span className="cursor-help text-slate-400" title="Paste raw logs directly. E.g. writing 128-100 on a line translates to 128 logged with 100 amount. If you omit the amount (e.g. 128), it defaults to the Amount input field value above.">
                    <Info className="h-3 w-3" />
                  </span>
                </div>
                <textarea
                  className="w-full h-16 text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="Paste entries here...&#10;128-100&#10;129-200"
                  value={quickPasteText}
                  onChange={(e) => setQuickPasteText(e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  className="w-full text-xs py-1.5 font-bold" 
                  onClick={handleQuickPasteSidebar}
                  isLoading={quickPasteLoading}
                >
                  Parse & Log Entries
                </Button>
              </div>
            </div>

            {/* Quick Search Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Find / Highlight</h3>
              <div className="relative">
                <input
                  type="text"
                  maxLength={activeView === 'panna' ? 3 : activeView === 'jodi' ? 2 : 1}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 pl-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    activeView === 'panna' ? 'Search number (e.g. 128)' :
                    activeView === 'jodi' ? 'Search Jodi (e.g. 25)' : 'Search digit (e.g. 5)'
                  }
                />
                <svg className="h-4 w-4 text-slate-400 absolute left-2.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Clear Highlight
                </button>
              )}
            </div>

            {/* Log panel */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 logs-panel">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                Recent Logs
              </h3>
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No entries recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs transition hover:bg-slate-100"
                    >
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-bold text-slate-800">
                            {formatLogNumber(log.number)}
                          </span>
                          <span className={`px-1 rounded text-[10px] font-bold ${
                            log.type === 'ADD' ? 'bg-emerald-50 text-emerald-600' :
                            log.type === 'SUBTRACT' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {log.type}
                          </span>
                          {log.is_family && (
                            <span className="px-1 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase scale-90 origin-left">
                              Family Cuts
                            </span>
                          )}
                          <span className="font-semibold text-slate-700">₹{log.amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5 gap-2 flex-wrap">
                          <span className="font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px]">
                            {getChartTypeLabel(log.chart_type)}
                          </span>
                          <span>by {log.user_username || 'unknown'}</span>
                          <span className="shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleUndoLog(log.id)}
                          className="p-1 hover:bg-white text-slate-400 hover:text-red-500 rounded border border-transparent hover:border-slate-200 transition cursor-pointer"
                          title="Undo Entry"
                          disabled={deleteLogMutation.isPending}
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 220 Family Grid (Main Content Area) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm print-area">
            {!selectedChartName ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 min-h-[350px] text-center space-y-3 no-print">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                  <Scissors className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-800">No Chart Selected</h4>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
                    Please select an existing chart from the dropdown or pick a different Group/Date in the toolbar.
                  </p>
                </div>
              </div>
            ) : (
              renderActiveChartGrid(activeChart || null, activeView)
            )}
          </div>
        </div>
      )}

      {/* Interactive Modal for Clicking Cells */}
      <Modal
        isOpen={selectedCell !== null}
        onClose={() => {
          setSelectedCell(null);
          setCellModalAmount('');
          setCellModalApplyFamily(false);
        }}
        title={
          selectedCell
            ? selectedCell.startsWith('SU')
              ? `Adjust Amount for Sutta: ${selectedCell.substring(2)}`
              : selectedCell.startsWith('MPSP_')
              ? `Adjust Amount for Motor SP: ${selectedCell.replace('MPSP_', '')}`
              : selectedCell.startsWith('MPDP_')
              ? `Adjust Amount for Motor DP: ${selectedCell.replace('MPDP_', '')}`
              : selectedCell.startsWith('SGM_')
              ? `Adjust Amount for Sangam: ${selectedCell.replace('SGM_', '')}`
              : selectedCell.startsWith('CHK_')
              ? `Adjust Amount for Chakwad: ${selectedCell.replace('CHK_', '')}`
              : selectedCell.startsWith('S')
              ? `Adjust Amount for SP: ${selectedCell.substring(1)}`
              : selectedCell.startsWith('D')
              ? `Adjust Amount for DP: ${selectedCell.substring(1)}`
              : selectedCell.length === 2
              ? `Adjust Amount for Jodi: ${selectedCell}`
              : `Adjust Amount for Panna: ${selectedCell}`
            : 'Adjust Amount'
        }
        size="sm"
      >
        <form onSubmit={handleCellModalSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Current Logged Amount</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {selectedCell ? formatCurrency(amounts[selectedCell] || 0) : '₹0'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Mode</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => setCellModalMode('ADD')}
                className={`py-1.5 rounded-md cursor-pointer transition ${
                  cellModalMode === 'ADD' ? 'bg-white shadow-sm text-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setCellModalMode('SUBTRACT')}
                className={`py-1.5 rounded-md cursor-pointer transition ${
                  cellModalMode === 'SUBTRACT' ? 'bg-white shadow-sm text-red-600' : 'hover:bg-slate-50'
                }`}
              >
                Sub
              </button>
              <button
                type="button"
                onClick={() => setCellModalMode('SET')}
                className={`py-1.5 rounded-md cursor-pointer transition ${
                  cellModalMode === 'SET' ? 'bg-white shadow-sm text-amber-600' : 'hover:bg-slate-50'
                }`}
              >
                Set
              </button>
            </div>
          </div>

          <Input
            label="Adjustment Amount (INR)"
            type="number"
            value={cellModalAmount}
            onChange={(e) => setCellModalAmount(e.target.value)}
            placeholder="e.g. 100"
            required
            autoFocus
          />

          {selectedCell && (selectedCell.startsWith('SU') || selectedCell.startsWith('S') || selectedCell.startsWith('D') || selectedCell.length === 2 || (!selectedCell.includes('_') && selectedCell.length === 3)) && (
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="cellModalApplyFamily"
                checked={cellModalApplyFamily}
                onChange={(e) => setCellModalApplyFamily(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="cellModalApplyFamily" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                Apply to Family (Cuts)
              </label>
            </div>
          )}

          {/* Quick Increment Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Increments</label>
            <div className="flex flex-wrap gap-1.5">
              {[100, 200, 500, 1000, 2000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCellModalAmount(val.toString())}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelectedCell(null);
                setCellModalAmount('');
                setCellModalApplyFamily(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={logEntryMutation.isPending}>
              Apply Changes
            </Button>
          </div>
        </form>
      </Modal>



      {/* Rename Chart Modal */}
      <Modal
        isOpen={isRenameChartOpen}
        onClose={() => setIsRenameChartOpen(false)}
        title="Rename Chart"
        size="sm"
      >
        <form onSubmit={handleRenameChartSubmit} className="space-y-4">
          {chartError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {chartError}
            </div>
          )}
          <Input
            label="New Chart Name"
            type="text"
            value={renameChartName}
            onChange={(e) => setRenameChartName(e.target.value)}
            placeholder="e.g. Session 1"
            required
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsRenameChartOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateChartMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Chart Modal */}
      <Modal
        isOpen={isCreateChartOpen}
        onClose={() => setIsCreateChartOpen(false)}
        title="Create New Chart"
        size="sm"
      >
        <form onSubmit={handleCreateChartSubmit} className="space-y-4">
          {chartError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {chartError}
            </div>
          )}
          <Input
            label="Chart Name"
            type="text"
            value={newChartName}
            onChange={(e) => setNewChartName(e.target.value)}
            placeholder="e.g. Time Bazaar Open"
            required
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsCreateChartOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isChartLoading}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
      {/* Printable Area for ALL Charts compilation */}
      {allChartsToPrint && (
        <div className="hidden print:block absolute left-0 top-0 w-full bg-white print-all-container">
          {allChartsToPrint.map((chart, index) => {
            const chartAmounts = chart.amounts || {};
            const chartLimit = chart.limit || 1000;
            const chartType = chart.chart_type;

            return (
              <div 
                key={chart.id} 
                className={`w-full bg-white p-4 ${index < allChartsToPrint.length - 1 ? 'page-break' : ''}`}
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                <div className="bg-[#facc15] text-[#b91c1c] text-xl font-extrabold text-center py-3 border-2 border-black tracking-wide uppercase mb-4 print-title">
                  {chart.name} ({
                    chartType === 'panna' ? 'Family Chart' :
                    chartType === 'jodi' ? 'Jodi Chart' :
                    chartType === 'sutta' ? 'Sutta Chart' :
                    chartType === 'mpsp' ? 'Motor Single Pana (MPSP)' :
                    chartType === 'mpdp' ? 'Motor Double Pana (MPDP)' :
                    chartType === 'sangam' ? 'Sangam' : 'Chakwad'
                  }) - Limit: ₹{chartLimit}
                </div>

                {chartType === 'panna' && renderPrintPannaTable(chartAmounts, chartLimit, chart.green_limit, chart.yellow_limit)}
                {chartType === 'jodi' && renderPrintJodiTable(chartAmounts, chartLimit, chart.green_limit, chart.yellow_limit, true)}
                {chartType === 'sutta' && renderPrintSuttaTable(chartAmounts, chartLimit, chart.green_limit, chart.yellow_limit, true)}
                {(chartType === 'mpsp' || chartType === 'mpdp' || chartType === 'sangam' || chartType === 'chakwad') && renderPrintListTable(chartType, chartAmounts, chartLimit, chart.green_limit, chart.yellow_limit, true)}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Tooltip/Toast for Success or Error Messages */}
      {(addCuttingSuccess || addCuttingError) && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up no-print">
          {addCuttingSuccess ? (
            <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 max-w-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping shrink-0" />
              <div className="text-sm font-bold">{addCuttingSuccess}</div>
              <button 
                onClick={() => setAddCuttingSuccess('')} 
                className="text-white/70 hover:text-white font-bold ml-2 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-start gap-3 border border-red-500 max-w-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-100 mt-0.5" />
              <div className="text-sm font-bold flex-1">{addCuttingError}</div>
              <button 
                onClick={() => setAddCuttingError('')} 
                className="text-white/70 hover:text-white font-bold ml-2 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default CuttingPage;
