import React, { useState } from 'react';
import { X, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { glassPanel, headingFont } from '../styles';

const LAST_UPDATED = '19 พฤษภาคม 2568';
const CONTACT_EMAIL = 'boomzalnw2@gmail.com';
const SITE_URL = 'https://boomtech.app';

function Section({ title, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-indigo-500/10 last:border-0">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex justify-between items-center py-3 text-left text-sm font-semibold text-white hover:text-indigo-300 transition-colors"
            >
                {title}
                {open ? <ChevronUp className="w-4 h-4 shrink-0 text-slate-400"/> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400"/>}
            </button>
            {open && (
                <div className="pb-4 text-sm text-slate-400 leading-relaxed space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
}

function PrivacyContent() {
    return (
        <div className="space-y-1">
            <p className="text-xs text-slate-500 mb-4">อัปเดตล่าสุด: {LAST_UPDATED}</p>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                BoomTech Gateway (<strong>{SITE_URL}</strong>) ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน
                นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลของท่าน
                ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
            </p>

            <Section title="1. ผู้ควบคุมข้อมูลส่วนบุคคล">
                <p>BoomTech Gateway ดำเนินการโดยเจ้าของบัญชี {CONTACT_EMAIL}</p>
                <p>ที่อยู่เว็บไซต์: {SITE_URL}</p>
                <p>ติดต่อ DPO: {CONTACT_EMAIL}</p>
            </Section>

            <Section title="2. ข้อมูลที่เราเก็บรวบรวม">
                <p><strong className="text-white">2.1 ข้อมูลที่ท่านให้เราโดยตรง</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>ที่อยู่จัดส่งสินค้า (ชื่อ เบอร์โทร ที่อยู่)</li>
                    <li>เนื้อหาข้อความในชุมชน (Community Chat)</li>
                    <li>ชื่อและอีเมลจาก Google Sign-In (หากเลือกใช้)</li>
                    <li>เบอร์โทรศัพท์จาก Phone Sign-In (หากเลือกใช้)</li>
                </ul>
                <p className="mt-2"><strong className="text-white">2.2 ข้อมูลที่เก็บโดยอัตโนมัติ</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>IP Address และ User Agent (เก็บ 90 วันตาม พ.ร.บ. คอมพิวเตอร์ ม.26)</li>
                    <li>Wallet Address บน Blockchain (ข้อมูลสาธารณะ)</li>
                    <li>แท็บที่เข้าชมและเวลา</li>
                    <li>Cookies ตามที่ท่านยินยอม</li>
                </ul>
                <p className="mt-2"><strong className="text-white">2.3 ข้อมูลที่ไม่เก็บ</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Private Key หรือ Seed Phrase ของกระเป๋า crypto</li>
                    <li>ข้อมูลบัตรเครดิต/เดบิต</li>
                    <li>รหัสผ่าน (ไม่มีระบบ username/password)</li>
                </ul>
            </Section>

            <Section title="3. วัตถุประสงค์และฐานทางกฎหมาย">
                <div className="space-y-2">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-white font-medium">บริการหลัก</p>
                        <p>ฐาน: การปฏิบัติตามสัญญา — เพื่อให้บริการกระเป๋า crypto และร้านค้าออนไลน์</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-white font-medium">การเก็บ Log 90 วัน</p>
                        <p>ฐาน: การปฏิบัติตามกฎหมาย — ตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ มาตรา 26</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-white font-medium">การวิเคราะห์การใช้งาน</p>
                        <p>ฐาน: ความยินยอม — ต้องการความยินยอมแยกต่างหาก</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-white font-medium">ความปลอดภัยและป้องกันการฉ้อโกง</p>
                        <p>ฐาน: ประโยชน์โดยชอบด้วยกฎหมาย — ตรวจสอบการใช้งานที่ผิดปกติ</p>
                    </div>
                </div>
            </Section>

            <Section title="4. การเก็บรักษาและระยะเวลา">
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Access Logs (IP/UA): <strong className="text-white">90 วัน</strong> จากนั้นลบอัตโนมัติ</li>
                    <li>ข้อมูลสั่งซื้อ: <strong className="text-white">5 ปี</strong> (ตามกฎหมายบัญชี)</li>
                    <li>ข้อความ Community Chat: ตลอดอายุบัญชี หรือจนกว่าจะถูกลบ</li>
                    <li>Cookies: ตามที่ระบุในนโยบาย Cookie</li>
                    <li>Google/Phone account: ตลอดอายุบัญชี Firebase Auth</li>
                </ul>
            </Section>

            <Section title="5. การเปิดเผยข้อมูลแก่บุคคลภายนอก">
                <p>เราไม่ขายข้อมูลส่วนบุคคลของท่าน เราอาจแบ่งปันข้อมูลกับ:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                    <li><strong className="text-white">Google Firebase / Firestore</strong> — เพื่อจัดเก็บข้อมูลและ Authentication</li>
                    <li><strong className="text-white">Vercel</strong> — เพื่อ hosting และ serverless functions</li>
                    <li><strong className="text-white">หน่วยงานรัฐ</strong> — เมื่อมีคำสั่งทางกฎหมาย</li>
                </ul>
                <p className="mt-2">ผู้ให้บริการทั้งหมดอยู่ภายใต้ข้อตกลงการประมวลผลข้อมูลที่เหมาะสม</p>
            </Section>

            <Section title="6. สิทธิ์ของเจ้าของข้อมูล (ตาม PDPA ม.30-37)">
                <ul className="space-y-2">
                    <li>🔍 <strong className="text-white">สิทธิ์เข้าถึง</strong> — ขอดูข้อมูลที่เราเก็บเกี่ยวกับท่าน</li>
                    <li>✏️ <strong className="text-white">สิทธิ์แก้ไข</strong> — ขอแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                    <li>🗑️ <strong className="text-white">สิทธิ์ลบ</strong> — ขอลบข้อมูล (ยกเว้นที่กฎหมายกำหนดให้เก็บ)</li>
                    <li>⏸️ <strong className="text-white">สิทธิ์ระงับ</strong> — ขอระงับการประมวลผลข้อมูล</li>
                    <li>📦 <strong className="text-white">สิทธิ์โอนย้าย</strong> — ขอรับข้อมูลในรูปแบบที่อ่านได้</li>
                    <li>❌ <strong className="text-white">สิทธิ์คัดค้าน</strong> — คัดค้านการประมวลผลข้อมูล</li>
                    <li>🔙 <strong className="text-white">สิทธิ์ถอนความยินยอม</strong> — ถอนความยินยอมได้ทุกเวลา</li>
                </ul>
                <p className="mt-3">ใช้สิทธิ์ได้โดยติดต่อ: <strong className="text-indigo-300">{CONTACT_EMAIL}</strong></p>
                <p className="text-xs text-slate-500 mt-1">เราจะตอบสนองภายใน 30 วันนับแต่ได้รับคำร้อง</p>
            </Section>

            <Section title="7. ความปลอดภัยของข้อมูล">
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>HTTPS/TLS สำหรับการส่งข้อมูลทั้งหมด</li>
                    <li>Firestore Security Rules จำกัดการเข้าถึงตามสิทธิ์</li>
                    <li>Firebase Custom Claims สำหรับการตรวจสอบ Admin</li>
                    <li>Content Security Policy (CSP) ป้องกัน XSS</li>
                    <li>Access Logs เก็บใน Private collection (เข้าถึงได้เฉพาะ Admin SDK)</li>
                </ul>
            </Section>

            <Section title="8. Cookies และเทคโนโลยีติดตาม">
                <p>เราใช้ Cookies ดังนี้:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li><strong className="text-white">Necessary</strong>: Firebase Auth session, การตั้งค่า Tab</li>
                    <li><strong className="text-white">Preferences</strong>: ภาษา, การตั้งค่าส่วนตัว</li>
                    <li><strong className="text-white">Analytics</strong>: ต้องการความยินยอม — ติดตามการใช้งาน</li>
                    <li><strong className="text-white">Marketing</strong>: ต้องการความยินยอม — ไม่ได้ใช้งานในปัจจุบัน</li>
                </ul>
                <p className="mt-2">จัดการ Cookies ได้ที่ปุ่ม "ตั้งค่า Cookie" ด้านล่างหน้าเว็บ</p>
            </Section>

            <Section title="9. การส่งข้อมูลไปต่างประเทศ">
                <p>บริการของเราใช้ Google Firebase (สหรัฐอเมริกา) และ Vercel (สหรัฐอเมริกา)
                ซึ่งมีมาตรการปกป้องข้อมูลตาม GDPR Standard Contractual Clauses
                และเป็นไปตาม PDPA มาตรา 28 เรื่องการส่งข้อมูลไปต่างประเทศ</p>
            </Section>

            <Section title="10. การเปลี่ยนแปลงนโยบาย">
                <p>เราอาจอัปเดตนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงสำคัญจะแจ้งผ่านหน้าเว็บไซต์
                วันที่อัปเดตล่าสุดระบุด้านบน การใช้งานต่อเนื่องถือว่ายอมรับนโยบายที่อัปเดต</p>
            </Section>

            <div className="mt-4 pt-4 border-t border-indigo-500/10 text-xs text-slate-500">
                <p>สอบถามหรือใช้สิทธิ์: <span className="text-indigo-400">{CONTACT_EMAIL}</span></p>
                <p className="mt-1">หากไม่ได้รับการตอบสนองภายใน 30 วัน ท่านมีสิทธิ์ร้องเรียนต่อ
                <strong className="text-slate-400"> สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)</strong></p>
            </div>
        </div>
    );
}

function TermsContent() {
    return (
        <div className="space-y-1">
            <p className="text-xs text-slate-500 mb-4">อัปเดตล่าสุด: {LAST_UPDATED}</p>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                โปรดอ่านข้อกำหนดการใช้งานนี้อย่างละเอียดก่อนใช้บริการ
                การใช้งาน BoomTech Gateway ถือว่าท่านยอมรับข้อกำหนดทั้งหมดนี้
            </p>

            <Section title="1. คำจำกัดความ">
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>"บริการ" หมายถึงเว็บแอปพลิเคชัน BoomTech Gateway ที่ {SITE_URL}</li>
                    <li>"ผู้ใช้" หมายถึงบุคคลที่เข้าถึงหรือใช้บริการ</li>
                    <li>"สินทรัพย์ดิจิทัล" หมายถึง Cryptocurrency และ Token ต่างๆ</li>
                    <li>"เราหรือเจ้าของบริการ" หมายถึงผู้ดำเนินการ BoomTech Gateway</li>
                </ul>
            </Section>

            <Section title="2. ลักษณะของบริการ">
                <p>BoomTech Gateway ให้บริการ:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li>เครื่องมือจัดการกระเป๋า Crypto (Wallet Interface) — เชื่อมต่อกับ Blockchain โดยตรง</li>
                    <li>ข้อมูลราคาตลาดสินทรัพย์ดิจิทัลเพื่อการอ้างอิง</li>
                    <li>ร้านค้าออนไลน์ที่รับชำระเงินด้วย Crypto และ PromptPay</li>
                    <li>พื้นที่ชุมชนสำหรับแลกเปลี่ยนข้อมูล</li>
                    <li>ข่าวสารจากแหล่งข้อมูลภายนอกเพื่อการอ้างอิง</li>
                </ul>
                <p className="mt-2 text-yellow-300/80 font-medium">
                    ⚠ บริการนี้ <strong>ไม่ใช่</strong> ผู้ให้บริการแลกเปลี่ยน (Exchange), นายหน้า (Broker),
                    หรือที่ปรึกษาการลงทุน และไม่ได้รับใบอนุญาตจาก ก.ล.ต. ในฐานะดังกล่าว
                </p>
            </Section>

            <Section title="3. เงื่อนไขการใช้งาน">
                <p>ท่านรับรองว่า:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>มีอายุครบ 20 ปีบริบูรณ์ หรือได้รับความยินยอมจากผู้ปกครอง</li>
                    <li>มีความเข้าใจเกี่ยวกับความเสี่ยงของสินทรัพย์ดิจิทัล</li>
                    <li>ใช้บริการเพื่อวัตถุประสงค์ที่ชอบด้วยกฎหมายเท่านั้น</li>
                    <li>ข้อมูลที่ให้ไว้มีความถูกต้องและเป็นปัจจุบัน</li>
                </ul>
            </Section>

            <Section title="4. พฤติกรรมต้องห้าม">
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>โพสต์เนื้อหาที่ผิดกฎหมาย หมิ่นประมาท หรือล่วงละเมิด</li>
                    <li>แพร่กระจาย Spam หรือ Phishing</li>
                    <li>พยายาม Hack หรือทำ DDoS</li>
                    <li>ปลอมแปลงตัวตนหรือข้อมูล</li>
                    <li>ใช้บริการเพื่อฟอกเงินหรือสนับสนุนกิจกรรมผิดกฎหมาย</li>
                    <li>ละเมิดสิทธิ์ทรัพย์สินทางปัญญาของผู้อื่น</li>
                </ul>
            </Section>

            <Section title="5. ความเสี่ยงสินทรัพย์ดิจิทัล">
                <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-3 text-red-300/80">
                    <p className="font-semibold text-red-300 mb-2">⚠ คำเตือนความเสี่ยง</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>ราคาสินทรัพย์ดิจิทัลมีความผันผวนสูงมาก อาจสูญเสียเงินทั้งหมด</li>
                        <li>ธุรกรรม Blockchain ไม่สามารถยกเลิกได้หลังยืนยัน</li>
                        <li>ไม่มีหน่วยงานกำกับดูแลหรือประกันเงินฝาก</li>
                        <li>ข้อมูลราคาบนบริการนี้ไม่ใช่คำแนะนำการลงทุน</li>
                    </ul>
                </div>
            </Section>

            <Section title="6. นโยบายร้านค้า">
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>ราคาสินค้าแสดงในบาทไทย คำนวณจากอัตราแลกเปลี่ยน ETH/USD ณ เวลานั้น</li>
                    <li>ผู้ซื้อรับผิดชอบค่าธรรมเนียม Gas สำหรับการชำระด้วย Crypto</li>
                    <li>การคืนสินค้าและเงิน — โปรดติดต่อ {CONTACT_EMAIL} ภายใน 7 วัน</li>
                    <li>เจ้าของบริการสงวนสิทธิ์ปฏิเสธคำสั่งซื้อที่น่าสงสัย</li>
                </ul>
            </Section>

            <Section title="7. ทรัพย์สินทางปัญญา">
                <p>เนื้อหา โลโก้ และโค้ดของ BoomTech Gateway เป็นทรัพย์สินของเจ้าของบริการ
                ห้ามทำซ้ำ แจกจ่าย หรือดัดแปลงโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร</p>
                <p className="mt-2">เนื้อหาที่ผู้ใช้โพสต์ใน Community Chat ถือเป็นทรัพย์สินของผู้โพสต์
                แต่ผู้ใช้มอบสิทธิ์ให้เจ้าของบริการแสดงและจัดเก็บเนื้อหาดังกล่าว</p>
            </Section>

            <Section title="8. การจำกัดความรับผิด">
                <p>BoomTech Gateway ไม่รับผิดชอบต่อ:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>การสูญเสียที่เกิดจากการลงทุนในสินทรัพย์ดิจิทัล</li>
                    <li>ธุรกรรม Blockchain ที่ล้มเหลวหรือค่าธรรมเนียมที่สูงผิดปกติ</li>
                    <li>ความถูกต้องของข้อมูลข่าวสารจากแหล่งภายนอก</li>
                    <li>ความเสียหายจากการเข้าถึงบริการโดยไม่ได้รับอนุญาต (Hacking)</li>
                    <li>การหยุดให้บริการชั่วคราวหรือถาวร</li>
                </ul>
            </Section>

            <Section title="9. การระงับและยกเลิกบัญชี">
                <p>เจ้าของบริการสงวนสิทธิ์ระงับหรือยกเลิกการเข้าถึงของผู้ใช้ที่:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>ละเมิดข้อกำหนดการใช้งาน</li>
                    <li>ก่อให้เกิดความเสียหายต่อผู้ใช้รายอื่นหรือบริการ</li>
                    <li>มีพฤติกรรมที่น่าสงสัยเกี่ยวกับการฟอกเงิน</li>
                </ul>
            </Section>

            <Section title="10. กฎหมายที่ใช้บังคับ">
                <p>ข้อกำหนดการใช้งานนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทใดๆ
                จะระงับโดยศาลที่มีเขตอำนาจในประเทศไทย</p>
                <p className="mt-2">กฎหมายที่เกี่ยวข้อง:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</li>
                    <li>พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2550 (แก้ไข 2560)</li>
                    <li>พ.ร.ก. การประกอบธุรกิจสินทรัพย์ดิจิทัล พ.ศ. 2561</li>
                    <li>พ.ร.บ. คุ้มครองผู้บริโภค พ.ศ. 2522</li>
                </ul>
            </Section>

            <div className="mt-4 pt-4 border-t border-indigo-500/10 text-xs text-slate-500">
                <p>คำถามเกี่ยวกับข้อกำหนด: <span className="text-indigo-400">{CONTACT_EMAIL}</span></p>
            </div>
        </div>
    );
}

export default function LegalModal({ mode, onClose }) {
    const isPrivacy = mode === 'privacy';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl ${glassPanel} relative`}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-indigo-500/10 shrink-0">
                    <div className="flex items-center gap-3">
                        {isPrivacy
                            ? <Shield className="w-5 h-5 text-indigo-400"/>
                            : <FileText className="w-5 h-5 text-indigo-400"/>
                        }
                        <h2 className={`text-lg font-bold text-white ${headingFont}`}>
                            {isPrivacy ? 'นโยบายความเป็นส่วนตัว' : 'ข้อกำหนดการใช้งาน'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {isPrivacy ? <PrivacyContent/> : <TermsContent/>}
                </div>
            </div>
        </div>
    );
}
