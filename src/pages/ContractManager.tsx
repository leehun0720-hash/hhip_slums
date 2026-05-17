import { useState } from 'react';
import { FileText, Printer, Download } from 'lucide-react';
import { downloadPDF } from '@/lib/exportUtils';
import { format } from 'date-fns';

export default function ContractManager() {
  const [formData, setFormData] = useState({
    partyA: 'HD Hyundai Heavy Industries Philippines, Inc.',
    partyB: '(주)이어진',
    partyBEng: 'IEOJIN Corp.',
    totalValue: 192740,
    workwearQty: 10000,
    workwearPrice: 14.00,
    prodQty: 3000,
    prodPrice: 17.58,
    deliveryDate: '2026-05-15',
    contractDate: '2026-02-23',
    logoCount: 13000,
    advancePercent: 30,
    balancePercent: 70,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdfDownload = () => {
    downloadPDF('contract-document', `계약서_${format(new Date(), 'yyyyMMdd')}`);
  };

  // 계산
  const workwearTotal = formData.workwearQty * formData.workwearPrice;
  const prodTotal = formData.prodQty * formData.prodPrice;
  const advanceAmount = formData.totalValue * (formData.advancePercent / 100);
  const balanceAmount = formData.totalValue * (formData.balancePercent / 100);

  const displayString = (val: string | number) => val || '___________';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">계약서 작성</h1>
        <p className="text-sm text-slate-500 mt-1">유니폼 공급 서비스 계약서의 빈칸을 채우고 PDF로 저장하거나 인쇄하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 입력 폼 (좌측) */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-semibold text-slate-800 flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" />
              계약 정보 입력
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">갑 (구매자)</label>
                <input type="text" name="partyA" value={formData.partyA} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">을 (공급자 - 한글)</label>
                <input type="text" name="partyB" value={formData.partyB} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">을 (공급자 - 영문)</label>
                <input type="text" name="partyBEng" value={formData.partyBEng} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 mb-1">총 계약금액 (USD)</label>
                <input type="number" name="totalValue" value={formData.totalValue} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">작업복 수량</label>
                  <input type="number" name="workwearQty" value={formData.workwearQty} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">작업복 단가 ($)</label>
                  <input type="number" name="workwearPrice" step="0.01" value={formData.workwearPrice} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">근무복 수량</label>
                  <input type="number" name="prodQty" value={formData.prodQty} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">근무복 단가 ($)</label>
                  <input type="number" name="prodPrice" step="0.01" value={formData.prodPrice} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-mono" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 mb-1">납기일</label>
                <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">계약일자</label>
                <input type="date" name="contractDate" value={formData.contractDate} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button onClick={handlePrint} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center transition-colors">
                <Printer className="w-4 h-4 mr-2" /> 인쇄
              </button>
              <button onClick={handlePdfDownload} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center transition-colors shadow-sm">
                <Download className="w-4 h-4 mr-2" /> PDF 저장
              </button>
            </div>
          </div>
        </div>

        {/* 계약서 미리보기 (우측) */}
        <div className="lg:col-span-8 overflow-x-auto bg-slate-50 p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-inner flex justify-center print:p-0 print:bg-white print:border-none print:shadow-none print:block">
          {/* A4 용지 스타일 컨테이너 */}
          <div 
            id="contract-document" 
            className="bg-white shadow-lg p-10 sm:p-16 text-[11px] sm:text-[13px] leading-relaxed text-slate-800 w-full max-w-[210mm] min-h-[297mm] print:shadow-none print:p-0 font-serif"
            style={{ boxSizing: 'border-box' }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">유니폼 공급 서비스 계약서</h1>
              <p className="text-lg font-semibold">(Uniform Supply Service Contract)</p>
            </div>

            <h2 className="text-base font-bold mt-6 mb-2 border-b border-slate-300 pb-1">(한글본 / Korean Version)</h2>

            <h3 className="font-bold mt-4 mb-1">제1조 (계약의 목적 및 당사자)</h3>
            <p className="mb-2">본 계약은 <strong>{displayString(formData.partyA)}</strong> (이하 갑)과 <strong>{displayString(formData.partyB)}</strong> (이하 을) 간의 유니폼 공급 및 관련 서비스에 관한 권리와 의무를 규정함을 목적으로 합니다.</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li><strong>물품 및 가액</strong>: 총액 USD {displayString(formData.totalValue.toLocaleString())}</li>
              <li><strong>일반 작업복 (Workwear Uniform)</strong>: {displayString(formData.workwearQty.toLocaleString())} 세트 (단가 ${displayString(formData.workwearPrice)}) - 소계 ${displayString(workwearTotal.toLocaleString())}</li>
              <li><strong>근무복 (Production Uniform)</strong>: {displayString(formData.prodQty.toLocaleString())} 세트 (단가 ${displayString(formData.prodPrice)}) - 소계 ${displayString(prodTotal.toLocaleString())}</li>
              <li><strong>로고 와펜 및 실리콘 로고 (Logo A - Wappen, silicon)</strong>: {displayString(formData.logoCount.toLocaleString())}개 - 무상 제공 (Free of Charge)</li>
              <li><strong>로고 및 브랜드</strong>: HD HYUNDAI HEAVY INDUSTRIES PHILIPPINES (갑이 제공하는 와펜 로고 및 해당 샘플 기준, 빛반사 제품)</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">제2조 (인도 기간 및 장소)</h3>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>을은 <strong>{displayString(formData.deliveryDate)}</strong> 이내(협의 된 날짜)까지 모든 물품을 지정된 장소에 납품 완료하여야 합니다.</li>
              <li>인도 장소: Cawag, Agila Southern Yard, Green Beach 1, Redondo Peninsula Sitio Agusuhin, 2,209, Subic, Zambales, Philippines.</li>
              <li>인도 조건: DDP (Delivered Duty Paid) 기준.</li>
            </ol>

            <h3 className="font-bold mt-4 mb-1">제3조 (결제 조건)</h3>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li><strong>선금 (Advance Payment)</strong>: 갑은 본 계약 체결 시 총 계약 가액의 {formData.advancePercent}% (USD {displayString(advanceAmount.toLocaleString())})를 을에게 지급합니다.</li>
              <li><strong>잔금 (Balance Payment)</strong>: 갑은 물품 납품 완료 후 14일 이내에 나머지 {formData.balancePercent}% (USD {displayString(balanceAmount.toLocaleString())})를 을에게 지급합니다.</li>
            </ol>

            <h3 className="font-bold mt-4 mb-1">제4조 (검수 및 하자담보책임)</h3>
            <p className="mb-2">갑은 다음과 같이 단계별로 검수를 진행하며, 각 기간 내에 발견된 하자 사항을 을에게 통보합니다.</p>
            <ol className="list-decimal pl-5 mb-2 space-y-1">
              <li><strong>외관 및 수량 체크</strong> (납품 후 1-3일 이내): 박스 수량, 외관 파손, 송장 일치 여부 확인.</li>
              <li><strong>품질 샘플 검사</strong> (납품 후 7-14일 이내): 봉제 상태, 원단 불량, 사이즈 스펙 등 샘플링 검사.</li>
              <li><strong>실착용 및 잠재 하자 검수</strong> (납품 후 30일 이내): 세탁 후 변형, 착용 시 불편함 등 사용 중 발견되는 하자 확인.</li>
            </ol>
            <ul className="list-disc pl-5 mb-4">
              <li><strong>을의 의무</strong>: 을은 납품한 제품의 하자(나염 불량, 탈색, 이색, 봉제 불량 등)가 발생하거나 을의 귀책 사유로 갑에게 손해를 끼친 경우 손해를 배상하여야 합니다.</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">제5조 (지체상금 및 계약 위반)</h3>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li><strong>납품 지연</strong>: 을이 납품 기일 내에 물품을 인도하지 못할 경우, 지연에 따른 위약금은 일간 0.2% 발생하며, 최대 총 계약 가액의 8%를 최대 요율로 적용합니다.</li>
              <li><strong>전액 배상</strong>: 갑 또는 을이 본 계약상의 중요 의무를 위반할 경우, 위반 당사자는 상대방에게 발생한 손해액 전부를 배상하여야 합니다.</li>
            </ol>

            <h3 className="font-bold mt-4 mb-1">제6조 (지식재산권 및 거래 제한)</h3>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li><strong>지식재산권 및 패턴 소유권</strong>: 본 계약을 위해 제작된 모든 유니폼 패턴, 디자인 및 관련 기술 문서는 구매자인 갑의 독점적 지식재산권으로 귀속됩니다. 을은 갑의 서면 승인 없이 본 패턴을 타처에 사용하거나 제3자에게 제공할 수 없습니다.</li>
              <li><strong>직거래 금지</strong>: 을은 본 계약 체결 이후 갑을 배제하고 제3의 업체와 직접 거래하거나 연락하는 행위를 엄격히 금지합니다.</li>
              <li><strong>로고 사용 제한</strong>: 갑이 제공한 로고 및 와펜의 사용은 본 계약 물량 생산으로 엄격히 제한됩니다.</li>
            </ol>

            <h3 className="font-bold mt-4 mb-1">제7조 (분쟁 해결)</h3>
            <p className="mb-4">본 계약과 관련하여 발생할 수 있는 모든 분쟁은 대한상사중재원(KCAB)의 중재 규정에 따라 해결하며, 중재 판정은 최종적인 것으로서 양 당사자를 구속합니다.</p>

            <h3 className="font-bold mt-4 mb-1">제8조 (특수사항)</h3>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>본 조항의 특수사항은 강제적 이행사항은 아니며 갑과 을 쌍방간의 협의에 의해 명시합니다.</li>
              <li>을은 갑의 긴급 요청이 있을 경우 일정 수량을 우선적으로 납품하도록 노력합니다.</li>
            </ol>

            <h3 className="font-bold mt-4 mb-1">제9조 (별첨 : 제품 공급 사이즈 스펙 및 수량)</h3>
            <ul className="list-disc pl-5 mb-2 space-y-1">
              <li><strong>제작 원단</strong>: 인보이스 참조 (Refer to Invoice).</li>
            </ul>
            <ol className="list-decimal pl-5 mb-8 space-y-1">
              <li><strong>근무복 (Production Uniform)</strong> - 총 {displayString(formData.prodQty.toLocaleString())} 세트: 상의 95(500), 100(1,500), 105(250), 110(750) / 하의 28(1,250), 30(1,250), 32(500).</li>
              <li><strong>작업복 (Workwear Uniform)</strong> - 총 {displayString(formData.workwearQty.toLocaleString())} 세트: 상의 95(1,500), 100(4,000), 105(2,800), 110(1,500), 115(200) / 하의 28(1,250), 30(3,250), 32(3,250), 34(1,500), 36(750).</li>
            </ol>

            {/* Page Break for Print */}
            <div className="break-before-page"></div>

            <h2 className="text-base font-bold mt-8 mb-2 border-b border-slate-300 pb-1">(영문본 / English Version)</h2>

            <h3 className="font-bold mt-4 mb-1">Article 1 (Purpose and Parties)</h3>
            <p className="mb-2">This Contract is entered into by and between <strong>{displayString(formData.partyA)}</strong> (hereinafter Party A) and <strong>{displayString(formData.partyBEng)}</strong> (hereinafter Party B).</p>
            <ul className="list-disc pl-5 mb-4">
              <li><strong>Total Value</strong>: USD {displayString(formData.totalValue.toLocaleString())}.</li>
              <li><strong>Products</strong>: {displayString(formData.workwearQty.toLocaleString())} Workwear Uniform sets and {displayString(formData.prodQty.toLocaleString())} Production Uniform sets.</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">Article 2 (Delivery)</h3>
            <ul className="list-disc pl-5 mb-4">
              <li><strong>Deadline</strong>: By {displayString(formData.deliveryDate)}.</li>
              <li><strong>Terms</strong>: DDP Subic, Philippines.</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">Article 3 (Payment)</h3>
            <ul className="list-disc pl-5 mb-4">
              <li>{formData.advancePercent} percent Advance Payment upon signing.</li>
              <li>{formData.balancePercent} percent Balance Payment within 14 days after final delivery.</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">Article 4 (Inspection)</h3>
            <ul className="list-disc pl-5 mb-4">
              <li><strong>Phase 1</strong>: Appearance and Quantity (1-3 days).</li>
              <li><strong>Phase 2</strong>: Quality Sampling (7-14 days).</li>
              <li><strong>Phase 3</strong>: Latent Defects (30 days).</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">Article 5 (Penalty)</h3>
            <ul className="list-disc pl-5 mb-4">
              <li>A fixed penalty of 8 percent of the total contract value applies for delivery delays.</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">Article 6 (Intellectual Property and Trade Restrictions)</h3>
            <ul className="list-disc pl-5 mb-4">
              <li><strong>Intellectual Property and Pattern Ownership</strong>: All uniform patterns and designs developed for this contract shall be the exclusive intellectual property of Party A.</li>
              <li><strong>Restriction on Direct Trade</strong>: Party B is strictly prohibited from directly trading or contacting Hyundai affiliates in the Philippines.</li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">Article 7 (Dispute Resolution)</h3>
            <p className="mb-4">All disputes shall be finally settled by arbitration under the rules of the Korean Commercial Arbitration Board (KCAB).</p>

            <h3 className="font-bold mt-4 mb-1">Article 9 (Specifications)</h3>
            <ul className="list-disc pl-5 mb-8">
              <li><strong>Fabric Specification</strong>: Refer to Invoice.</li>
              <li>Quantities and size breakdown follow the final order data provided in the Korean section.</li>
            </ul>

            <h2 className="text-base font-bold mt-8 mb-2 border-b border-slate-300 pb-1">계약 당사자 서명란 (Signature Block)</h2>
            <p className="mb-2">본 계약을 증명하기 위하여 계약서 2부를 작성하여 양 당사자가 기명날인 후 각 1부씩 보관한다.</p>
            <p className="mb-4 text-slate-600 italic">(In witness whereof, the parties hereto have executed this Contract in duplicate by their duly authorized representatives.)</p>
            
            <p className="mb-6"><strong>Date</strong>: {displayString(formData.contractDate)}</p>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <p className="font-bold mb-2">갑 (Party A)</p>
                <p><strong>Company</strong>: {displayString(formData.partyA)}</p>
                <p><strong>Address</strong>: Cawag, Agila Southern Yard, Green Beach 1, Redondo Peninsula Sitio Agusuhin, 2,209, Subic, Zambales, Philippines</p>
                <p><strong>Name</strong>: Tove gil kim</p>
                <div className="mt-8 border-b border-slate-400 w-48"></div>
                <p className="mt-1 text-xs text-slate-500">(Signature)</p>
              </div>
              <div>
                <p className="font-bold mb-2">을 (Party B)</p>
                <p><strong>Company</strong>: {displayString(formData.partyBEng)}</p>
                <p><strong>Address</strong>: 7F. 46, Songnae-daero 73beon-gil, Wonmi-gu, Bucheon-si, Gyeonggi-do, Republic of Korea</p>
                <p><strong>Name</strong>: 이상훈 (Lee Sang Hoon)</p>
                <p><strong>Title</strong>: 대표이사 (CEO/Director)</p>
                <div className="mt-8 border-b border-slate-400 w-48"></div>
                <p className="mt-1 text-xs text-slate-500">(Signature)</p>
              </div>
            </div>

            {/* Page Break for Print */}
            <div className="break-before-page"></div>

            <div className="text-center mt-8 mb-8">
              <h1 className="text-2xl font-bold mb-2">부록계약서 (ADDENDUM AGREEMENT)</h1>
            </div>

            <p className="mb-2">본 부록계약서(이하 "부록")는 <strong>{displayString(formData.partyB)}</strong>(이하 "이어진")과 <strong>{displayString(formData.partyA)}</strong>(이하 "HHIP") 간에 체결된 물품공급계약(이하 "본 계약")에 부수하여 체결됩니다.</p>
            <p className="mb-6 text-slate-600 italic">(This Addendum Agreement (hereinafter referred to as the "Addendum") is entered into as an attachment to the Supply Agreement (hereinafter referred to as the "Main Agreement") by and between {displayString(formData.partyBEng)} (hereinafter referred to as "IEOJIN") and {displayString(formData.partyA)} (hereinafter referred to as "HHIP").)</p>

            <h3 className="font-bold mt-4 mb-1">제1조 (품질 보증 / Quality Assurance)</h3>
            <ol className="list-decimal pl-5 mb-4 space-y-2">
              <li>
                "이어진"은 저급 자재를 사용하지 않을 것임을 보증합니다. "이어진"은 합의된 제품 사양 및 품질 보증 표준을 엄격히 준수해야 합니다. 또한 제품 안전 및 환경 보호와 관련된 관련 법규 및 규정을 준수해야 합니다.<br/>
                <span className="text-slate-600 italic">(IEOJIN warrants that it shall not use substandard materials. It shall strictly comply with agreed product specifications and quality assurance standards. It shall comply with relevant laws and regulations related to product safety and environmental protection.)</span>
              </li>
              <li>
                유니폼 생산에 사용되는 원단은 건강상의 위험을 초래할 수 있는 화학 물질이나 성분이 없어야 합니다.<br/>
                <span className="text-slate-600 italic">(The material to be used for the production of the uniform shall be free from chemicals or substances that could pose health risks.)</span>
              </li>
            </ol>

            <h3 className="font-bold mt-4 mb-1">제2조 (납기 단축 / Shortening of Delivery Time)</h3>
            <p className="mb-4">
              "HHIP"는 특별한 사유로 "이어진"에게 납기 단축을 요청할 수 있으며, 이 경우 총비용의 <strong>[ 빈칸 ]%</strong>를 추가로 지급해야 합니다. 이 경우 "이어진"은 요청된 조기 납품일에 주문된 유니폼을 인도하기 위해 최선의 노력을 다해야 합니다.<br/>
              <span className="text-slate-600 italic">(HHIP can request IEOJIN to shorten the delivery time for special reasons and with additional payment of [ ]% total cost. In which case, IEOJIN shall exert its best effort to deliver the ordered uniform on the requested earlier date.)</span>
            </p>

            <h3 className="font-bold mt-4 mb-1">제3조 (비밀 유지 / Confidentiality)</h3>
            <p className="mb-4">
              양 당사자가 취득한 모든 서면 및 구두 정보는 정보 비공개 당사자의 사전 서면 동의 없이 제3자에게 공개되거나 유출되어서는 안 됩니다.<br/>
              <span className="text-slate-600 italic">(All written and verbal information obtained by either Party shall not be disclosed or leaked to third parties without the prior written consent of the non-disclosing party.)</span>
            </p>

            <h3 className="font-bold mt-4 mb-1">제4조 (계약의 취소 및 해지 / Cancellation and Termination)</h3>
            <p className="mb-2">일방 당사자는 다음 조건에 근거하여 상대방에게 적절한 통지를 함으로써 본 계약을 취소할 수 있습니다. <span className="text-slate-600 italic">(Either Party can cancel this Agreement by giving due notice to the other party based on the following conditions:)</span></p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li><strong>a.</strong> 계약상 일방 당사자의 의무 위반 또는 불이행 <span className="text-slate-600 italic">(Violation or non-fulfillment of obligations by either Party in the contract.)</span></li>
              <li><strong>b.</strong> 일방 당사자의 적용 법률, 규칙 및 규정 위반 <span className="text-slate-600 italic">(Violation of applicable laws, rules and regulations by either Party.)</span></li>
              <li><strong>c.</strong> "이어진"의 내부 회사 문제로 인해 "HHIP"와의 비즈니스 거래를 지속할 수 없는 경우 <span className="text-slate-600 italic">(In case IEOJIN cannot continue its business transactions with HHIP due to internal company issues.)</span></li>
            </ul>

            <h3 className="font-bold mt-4 mb-1">제5조 (사전 해지 통보 / Pre-termination Notice)</h3>
            <p className="mb-4">
              귀책 사유가 없는 당사자는 예정된 사전 해지일 30일 전에 상대방에게 서면으로 사전 해지 통지서를 발송해야 합니다.<br/>
              <span className="text-slate-600 italic">(The innocent Party shall issue a written notice of pre termination to the other party 30 days prior to the intended pre-termination date.)</span>
            </p>

            <h3 className="font-bold mt-4 mb-1">제6조 (효력 / Validity)</h3>
            <p className="mb-8">
              본 부록은 본 계약의 필수 불가결한 일부를 구성하며, 본 계약과 동일한 법적 효력을 발휘합니다. 본 부록과 본 계약의 내용이 상충할 경우 본 부록의 내용이 우선합니다.<br/>
              <span className="text-slate-600 italic">(This Addendum constitutes an integral part of the Main Agreement and shall have the same legal force and effect as the Main Agreement. In case of any conflict between the terms of this Addendum and the Main Agreement, the terms of this Addendum shall prevail.)</span>
            </p>

            <h2 className="text-base font-bold mt-8 mb-4 border-b border-slate-300 pb-1">계약 당사자 서명란</h2>
            <p className="mb-6"><strong>날짜 (Date)</strong>: {displayString(formData.contractDate)}</p>

            <div className="grid grid-cols-2 gap-8 pb-10">
              <div>
                <p className="font-bold mb-2">[매도인 / Seller]</p>
                <p><strong>상호 (Company)</strong>: {displayString(formData.partyB)}</p>
                <p><strong>사업자등록정보</strong>: 571-88-02153 / 경기도 부천시 원미구 송내대로 73번길 46, 7층 / 도, 소매 공산품판매업</p>
                <div className="mt-8 border-b border-slate-400 w-48 relative">
                  <span className="absolute -top-6 text-sm text-slate-800">이상훈, 황수아</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">대표자 (Representative) (인/Signature)</p>
              </div>
              <div>
                <p className="font-bold mb-2">[매입인 / Buyer]</p>
                <p><strong>상호 (Company)</strong>: {displayString(formData.partyA)}</p>
                <div className="mt-[5.5rem] border-b border-slate-400 w-48"></div>
                <p className="mt-1 text-xs text-slate-500">대표자 (Representative) (인/Signature)</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
