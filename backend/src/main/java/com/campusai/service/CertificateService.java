package com.campusai.service;

import com.campusai.model.Certificate;
import com.campusai.model.Club;
import com.campusai.model.Event;
import com.campusai.model.User;
import com.campusai.repository.CertificateRepository;
import com.campusai.repository.ClubRepository;
import com.campusai.repository.EventRepository;
import com.campusai.repository.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Optional;

@Service
public class CertificateService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClubRepository clubRepository;

    public Certificate issueCertificate(Long userId, Long eventId) {
        if (certificateRepository.existsByUserIdAndEventId(userId, eventId)) {
            return null; // Already issued
        }

        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null) return null;

        Long clubId = event.getClubId() != null ? event.getClubId() : 0L;
        String certNum = UUID.randomUUID().toString();

        Certificate certificate = new Certificate();
        certificate.setUserId(userId);
        certificate.setEventId(eventId);
        certificate.setClubId(clubId);
        certificate.setCertificateNumber(certNum);

        System.out.println("Certificate created in memory for user: " + userId);

        // Save first to get ID and dates
        certificate.setPdfPath("pending"); 
        certificate = certificateRepository.save(certificate);

        // Generate PDF
        String pdfPath = generateAndSavePdf(certificate, event);
        if (pdfPath != null) {
            certificate.setPdfPath(pdfPath);
            certificate = certificateRepository.save(certificate);
            System.out.println("Certificate saved physically at: " + pdfPath);
        }

        return certificate;
    }

    public byte[] generatePdfContent(String studentName, String eventName, String clubName, String completionDate, String certNumber) {
        try {
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            
            document.open();
            
            // Add colored background/borders
            com.lowagie.text.pdf.PdfContentByte canvas = writer.getDirectContentUnder();
            canvas.setColorFill(new java.awt.Color(245, 247, 255)); // Light bluish background
            canvas.rectangle(0, 0, document.getPageSize().getWidth(), document.getPageSize().getHeight());
            canvas.fill();

            // Border
            canvas.setColorStroke(new java.awt.Color(108, 99, 255)); // Primary neon color
            canvas.setLineWidth(15f);
            canvas.rectangle(20, 20, document.getPageSize().getWidth() - 40, document.getPageSize().getHeight() - 40);
            canvas.stroke();

            // Inner border
            canvas.setColorStroke(new java.awt.Color(200, 200, 220));
            canvas.setLineWidth(2f);
            canvas.rectangle(35, 35, document.getPageSize().getWidth() - 70, document.getPageSize().getHeight() - 70);
            canvas.stroke();

            // Add Text
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 42, new java.awt.Color(108, 99, 255));
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 20, java.awt.Color.DARK_GRAY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 16, java.awt.Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, java.awt.Color.BLACK);

            Paragraph header = new Paragraph("CampusAI Platform", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new java.awt.Color(50, 50, 50)));
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingBefore(40);
            document.add(header);

            Paragraph title = new Paragraph("CERTIFICATE OF COMPLETION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(20);
            title.setSpacingAfter(20);
            document.add(title);

            Paragraph subtitle = new Paragraph("This is proudly presented to", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            Paragraph name = new Paragraph(studentName, boldFont);
            name.setAlignment(Element.ALIGN_CENTER);
            name.setSpacingAfter(20);
            document.add(name);

            Paragraph text = new Paragraph("for successfully participating and completing the event:", normalFont);
            text.setAlignment(Element.ALIGN_CENTER);
            text.setSpacingAfter(20);
            document.add(text);

            Paragraph eventTitleParagraph = new Paragraph(eventName, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new java.awt.Color(108, 99, 255)));
            eventTitleParagraph.setAlignment(Element.ALIGN_CENTER);
            eventTitleParagraph.setSpacingAfter(20);
            document.add(eventTitleParagraph);

            Paragraph organizer = new Paragraph("Organized by: " + clubName, subtitleFont);
            organizer.setAlignment(Element.ALIGN_CENTER);
            organizer.setSpacingAfter(40);
            document.add(organizer);

            // Create a table for Date and Signature to align them properly
            com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(2);
            table.setWidthPercentage(80);
            
            com.lowagie.text.pdf.PdfPCell dateCell = new com.lowagie.text.pdf.PdfPCell(new Paragraph("Date: " + completionDate + "\n\n___________________", normalFont));
            dateCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            dateCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            
            com.lowagie.text.pdf.PdfPCell sigCell = new com.lowagie.text.pdf.PdfPCell(new Paragraph("Signature\n\n___________________", normalFont));
            sigCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            sigCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            table.addCell(dateCell);
            table.addCell(sigCell);
            document.add(table);

            Paragraph certIdText = new Paragraph("Certificate No: " + certNumber, FontFactory.getFont(FontFactory.HELVETICA, 12, java.awt.Color.GRAY));
            certIdText.setAlignment(Element.ALIGN_CENTER);
            certIdText.setSpacingBefore(30);
            document.add(certIdText);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public byte[] generateDemoPdfBytes() {
        return generatePdfContent("Demo Student", "AI Workshop Demo Event", "CampusAI Demo Club", 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")), "DEMO-" + UUID.randomUUID().toString().substring(0, 8));
    }

    private String generateAndSavePdf(Certificate cert, Event event) {
        User user = userRepository.findById(cert.getUserId()).orElse(null);
        Club club = clubRepository.findById(cert.getClubId()).orElse(null);

        String studentName = (user != null) ? user.getName() : "Student";
        String eventName = (event != null) ? event.getTitle() : "Event";
        String clubName = (club != null) ? club.getName() : (event != null && event.getOrganizerName() != null ? event.getOrganizerName() : "CampusAI Platform");
        String completionDate = (cert.getIssuedDate() != null) ? cert.getIssuedDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) : LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));

        byte[] pdfBytes = generatePdfContent(studentName, eventName, clubName, completionDate, cert.getCertificateNumber());
        if (pdfBytes == null) return null;

        try {
            File dir = new File("./data/certificates");
            if (!dir.exists()) dir.mkdirs();

            String fileName = "cert_" + cert.getCertificateNumber() + ".pdf";
            File pdfFile = new File(dir, fileName);
            Files.write(pdfFile.toPath(), pdfBytes);
            
            System.out.println("PDF generated successfully. File path: " + pdfFile.getAbsolutePath() + " | Size: " + pdfBytes.length + " bytes");
            return pdfFile.getAbsolutePath();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public byte[] getPdfBytes(Long certificateId) {
        Optional<Certificate> certOpt = certificateRepository.findById(certificateId);
        if (!certOpt.isPresent()) return null;
        
        try {
            File file = new File(certOpt.get().getPdfPath());
            if (file.exists()) {
                return Files.readAllBytes(file.toPath());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
