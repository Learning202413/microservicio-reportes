import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf"; 
import autoTable from "jspdf-autotable";

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = "https://bxjqdsnekmbldvfnjvpg.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4anFkc25la21ibGR2Zm5qdnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjUyODUsImV4cCI6MjA3NDQ0MTI4NX0.ibjF_Icj3C81g5fRO6yuOhCxCyCzN7M_SCSjvUXSPwc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ENDPOINT
app.get("/api/reportes/proyectos/pdf", async (req, res) => {
  try {
      const { estado } = req.query; 

      let query = supabase.from("proyectos").select(`
        titulo,
        tipo,
        integrantes,
        estado
      `);

      if (estado && estado !== 'todos' && estado !== '') {
          query = query.eq("tipo", estado); 
      }

      const { data, error } = await query;

      if (error) throw error;
      
    
      if (!data || data.length === 0) {
        return res.status(404).json({ message: "No se encontraron proyectos de este tipo." });
      }

      // GENERAR PDF
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Reporte de Proyectos: ${estado ? estado.toUpperCase() : 'TODOS'}`, 10, 15);

      const rows = data.map((p, i) => [
        i + 1,
        p.titulo,
        p.tipo,
        p.integrantes || "Sin asignar",
        p.estado
      ]);

      autoTable(doc, {
        head: [["N°", "Título", "Tipo", "Integrantes", "Estado"]],
        body: rows,
        startY: 25,
      });

      
      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=reporte_${estado || 'general'}.pdf`);

      res.send(Buffer.from(pdfBuffer));

  } catch (err) {
      console.error("Error en microservicio:", err);
      res.status(500).json({ error: "Error interno generando el reporte" });
  }
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () =>
  console.log(`✅ Microservicio corriendo en puerto ${PORT}`)
);