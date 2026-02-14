import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import MergePdf from './pages/MergePdf';
import SplitPdf from './pages/SplitPdf';
import CompressPdf from './pages/CompressPdf';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import WordToPdf from './pages/WordToPdf';
import PdfToWord from './pages/PdfToWord';
import ExcelToPdf from './pages/ExcelToPdf';
import PdfToExcel from './pages/PdfToExcel';
import JpgToPdf from './pages/JpgToPdf';
import PdfToJpg from './pages/PdfToJpg';
import PdfToPowerPoint from './pages/PdfToPowerPoint';
import PowerPointToPdf from './pages/PowerPointToPdf';
import PdfToPdfA from './pages/PdfToPdfA';
import RedactPdf from './pages/RedactPdf'; // New
import CropPdf from './pages/CropPdf'; // New
import RotatePdf from './pages/RotatePdf';
import AddPageNumbers from './pages/AddPageNumbers';
import AddWatermark from './pages/AddWatermark';
import ProtectPdf from './pages/ProtectPdf';
import UnlockPdf from './pages/UnlockPdf';
import ComparePdf from './pages/ComparePdf';
import ScanToPdf from './pages/ScanToPdf';
import MobileScan from './pages/MobileScan'; // New
import RepairPdf from './pages/RepairPdf'; // New
import HtmlToPdf from './pages/HtmlToPdf'; // New

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/merge-pdf" element={<MergePdf />} />
            <Route path="/split-pdf" element={<SplitPdf />} />
            <Route path="/compress-pdf" element={<CompressPdf />} />
            <Route path="/repair-pdf" element={<RepairPdf />} />
            <Route path="/add-watermark" element={<AddWatermark />} />
            <Route path="/html-to-pdf" element={<HtmlToPdf />} />
            <Route path="/word-to-pdf" element={<WordToPdf />} />
            <Route path="/pdf-to-word" element={<PdfToWord />} />
            <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
            <Route path="/pdf-to-excel" element={<PdfToExcel />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
            <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
            <Route path="/pdf-to-powerpoint" element={<PdfToPowerPoint />} />
            <Route path="/powerpoint-to-pdf" element={<PowerPointToPdf />} />
            <Route path="/pdf-to-pdfa" element={<PdfToPdfA />} />
            <Route path="/redact-pdf" element={<RedactPdf />} />
            <Route path="/crop-pdf" element={<CropPdf />} />
            <Route path="/rotate-pdf" element={<RotatePdf />} />
            <Route path="/add-page-numbers" element={<AddPageNumbers />} />
            <Route path="/protect-pdf" element={<ProtectPdf />} />
            <Route path="/unlock-pdf" element={<UnlockPdf />} />
            <Route path="/compare-pdf" element={<ComparePdf />} />

            <Route path="/scan-pdf" element={<ScanToPdf />} />
            <Route path="/scan-mobile/:sessionId" element={<MobileScan />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
