import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf"; 
import autoTablePkg from "jspdf-autotable"; // 1. Cambiamos el nombre al importar

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN SUPABASE ---
const SUPABASE_URL = "https://bxjqdsnekmbldvfnjvpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4anFkc25la21ibGR2Zm5qdnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjUyODUsImV4cCI6MjA3NDQ0MTI4NX0.ibjF_Icj3C81g5fRO6yuOhCxCyCzN7M_SCSjvUXSPwc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. CORRECCIÓN IMPORTANTE: Definimos la función autoTable correctamente
// Esto maneja si la librería viene como 'default' o directa.
const autoTable = autoTablePkg.default || autoTablePkg;

app.get("/", (req, res) => {
    res.send("Microservicio de Reportes Funcionando 🚀");
});

app.get("/api/reportes/proyectos/pdf", async (req, res) => {
  console.log("📥 Recibida petición de PDF. Filtro:", req.query);
  
  try {
      const { estado } = req.query;

      let query = supabase.from("proyectos").select(`
        titulo,
        tipo,
        integrantes,
        estado
      `);

      if (estado && estado !== 'todos' && estado !== '') {
          console.log("🔍 Filtrando por tipo:", estado);
          query = query.eq("tipo", estado);
      }

      const { data, error } = await query;

      if (error) {
          console.error("❌ Error Supabase:", error);
          throw new Error("Error consultando base de datos: " + error.message);
      }

      if (!data || data.length === 0) {
          console.warn("⚠️ No se encontraron datos para el reporte.");
          return res.status(404).json({ message: "No se encontraron proyectos con ese filtro." });
      }

      console.log(`✅ Datos obtenidos: ${data.length} proyectos.`);

      // Generar PDF
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Reporte: ${estado ? estado.toUpperCase() : 'TODOS'}`, 10, 15);

      const rows = data.map((p, i) => [
        i + 1,
        p.titulo || "Sin Título",
        p.tipo || "Sin Tipo",
        p.integrantes || "No asignado",
        p.estado || "Pendiente"
      ]);

      // 3. Usamos la función ya corregida arriba
      autoTable(doc, {
        head: [["N°", "Título", "Tipo", "Integrantes", "Estado"]],
        body: rows,
        startY: 25,
      });

      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=reporte_${Date.now()}.pdf`);
      
      console.log("📤 Enviando PDF...");
      res.send(Buffer.from(pdfBuffer));

  } catch (err) {
      console.error("🔥 CRASH en microservicio:", err);
      res.status(500).json({ 
          error: "Error interno del servidor", 
          details: err.message 
      });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`✅ Servidor listo en puerto ${PORT}`)
);
