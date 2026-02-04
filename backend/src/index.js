import app, { prisma } from './app.js';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import http from 'http';
import { Server } from 'socket.io';
import xml2js from "xml2js";
import axios from "axios";



dotenv.config();

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Reflect request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Socket.io Signaling
const rooms = {};
const roomHosts = new Map();
const roomCreatorMap = new Map();

function parseGroupId(roomName) {
  if (typeof roomName !== 'string') return null;
  const m = roomName.match(/^SchoolERP_([^_]+)_/);
  return m ? m[1] : roomName;
}

io.on('connection', (socket) => {
  socket.on('join-room', async (roomId, userId) => {
    const gid = parseGroupId(roomId);
    try {
      let creatorId = roomCreatorMap.get(roomId);
      if (!creatorId) {
        const study = await prisma.groupStudy.findUnique({ where: { id: String(gid) }, select: { creatorId: true } });
        creatorId = study?.creatorId || null;
        if (creatorId) roomCreatorMap.set(roomId, creatorId);
      }
      if (creatorId && userId === creatorId) {
        roomHosts.set(roomId, socket.id);
      }
    } catch {}
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', { userId, socketId: socket.id });
    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', socket.id);
      if (roomHosts.get(roomId) === socket.id) {
        roomHosts.delete(roomId);
      }
    });
  });

  socket.on('join-request', async ({ roomName, groupId, userId, name }) => {
    const hostSocketId = roomHosts.get(roomName);
    if (!hostSocketId) {
      socket.emit('join-rejected', { roomName, reason: 'Host not connected' });
      return;
    }
    io.to(hostSocketId).emit('join-request', { userId, name, socketId: socket.id, roomName });
  });

  socket.on('approve-request', ({ targetSocketId, roomName }) => {
    io.to(targetSocketId).emit('join-approved', { roomName });
  });

  socket.on('reject-request', ({ targetSocketId, roomName, reason }) => {
    io.to(targetSocketId).emit('join-rejected', { roomName, reason: reason || 'Rejected' });
  });

  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', payload);
  });
});

const TALLY_URL = "http://localhost:9000";
const parser = new xml2js.Parser({ explicitArray: false });

/**
 * Utility: Send XML to Tally
 */
async function sendToTally(xml, { timeoutMs = 60000, retries = 0 } = {}) {
  try {
    const response = await axios.post(TALLY_URL, xml, {
      headers: { "Content-Type": "text/xml" },
      timeout: timeoutMs
    });
    return response.data;
  } catch (error) {
    if ((error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) && retries > 0) {
      await new Promise(r => setTimeout(r, 500));
      return sendToTally(xml, { timeoutMs, retries: retries - 1 });
    }
    if (error.code === 'ECONNREFUSED') {
      console.warn("Tally is not running or unreachable on port 9000. Returning mock data.");
      
      // Return mock XML response for development/testing when Tally is down
      if (xml.includes("CompanyCollection")) {
        return `
          <ENVELOPE>
            <BODY>
              <COMPANYCOLLECTION>
                <COMPANY>
                  <NAME>Demo Company (Mock)</NAME>
                </COMPANY>
                <COMPANY>
                  <NAME>Test Company (Mock)</NAME>
                </COMPANY>
              </COMPANYCOLLECTION>
            </BODY>
          </ENVELOPE>
        `;
      }
      throw new Error("Tally Unreachable");
    }
    throw error;
  }
}

/**
 * Get Company List
 */
app.get("/api/tally/companies", async (req, res) => {
  const xml = `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>CompanyCollection</ID>
  </HEADER>

  <BODY>
    <DESC>
      <STATICVARIABLES>
        <!-- IMPORTANT: set company context -->
        <SVCOMPANY>$$SysName:CurrentCompany</SVCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>

      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="CompanyCollection">
            <TYPE>Company</TYPE>
            <FETCH>Name</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

  try {
    const xmlResponse = await sendToTally(xml);
    const json = await parser.parseStringPromise(xmlResponse);
    res.json(json);
  } catch (err) {
    console.error("Tally Error:", err);
    res.status(500).send(err.message);
  }
});

function normalizeToArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function getAllGroupNames() {
  const xml = `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Export Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <EXPORTDATA>
   <REQUESTDESC>
    <STATICVARIABLES>
     <SVCOMPANY>$$SysName:CurrentCompany</SVCOMPANY>
     <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    </STATICVARIABLES>
    <TDL>
     <TDLMESSAGE>
      <COLLECTION NAME="GroupCollection">
       <TYPE>Group</TYPE>
       <FETCH>Name</FETCH>
      </COLLECTION>
     </TDLMESSAGE>
    </TDL>
   </REQUESTDESC>
  </EXPORTDATA>
 </BODY>
</ENVELOPE>`;
  const xmlResponse = await sendToTally(xml);
  const json = await parser.parseStringPromise(xmlResponse);
  const raw =
    json?.ENVELOPE?.BODY?.DATA?.COLLECTION?.GROUP ??
    json?.ENVELOPE?.BODY?.GROUPCOLLECTION?.GROUP;
  const groups = normalizeToArray(raw);
  return groups
    .map((g) => {
      const name =
        (g.$ && g.$.NAME) ||
        (typeof g.NAME === "string" ? g.NAME : g.NAME && g.NAME._) ||
        null;
      return name ? String(name).toLowerCase() : null;
    })
    .filter(Boolean);
}

async function getAllLedgerNames() {
  const xml = `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Export Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <EXPORTDATA>
   <REQUESTDESC>
    <STATICVARIABLES>
     <SVCOMPANY>$$SysName:CurrentCompany</SVCOMPANY>
     <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    </STATICVARIABLES>
    <TDL>
     <TDLMESSAGE>
      <COLLECTION NAME="LedgerCollection">
       <TYPE>Ledger</TYPE>
       <FETCH>Name</FETCH>
      </COLLECTION>
     </TDLMESSAGE>
    </TDL>
   </REQUESTDESC>
  </EXPORTDATA>
 </BODY>
</ENVELOPE>`;
  const xmlResponse = await sendToTally(xml);
  const json = await parser.parseStringPromise(xmlResponse);
  const raw =
    json?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER ??
    json?.ENVELOPE?.BODY?.LEDGERCOLLECTION?.LEDGER;
  const ledgers = normalizeToArray(raw);
  return ledgers
    .map((l) => {
      const name =
        (l.$ && l.$.NAME) ||
        (typeof l.NAME === "string" ? l.NAME : l.NAME && l.NAME._) ||
        null;
      return name ? String(name).toLowerCase() : null;
    })
    .filter(Boolean);
}

function createLedgerXml({ name, parent }) {
  const isParty = /sundry debtors|sundry creditors/i.test(parent);
  return `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Ledgers</REPORTNAME>
    <STATICVARIABLES>
     <SVCOMPANY>$$SysName:CurrentCompany</SVCOMPANY>
    </STATICVARIABLES>
   </REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE>
     <LEDGER ACTION="Create">
       <NAME>${name}</NAME>
       <PARENT>${parent}</PARENT>
       ${isParty ? `<ISPARTYLEDGER>Yes</ISPARTYLEDGER>` : ``}
       ${isParty ? `<ISBILLWISEON>Yes</ISBILLWISEON>` : ``}
       <AFFECTSSTOCK>No</AFFECTSSTOCK>
       <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
       <OPENINGBALANCE>0</OPENINGBALANCE>
       <LANGUAGENAME.LIST>
         <NAME.LIST>
           <NAME>${name}</NAME>
         </NAME.LIST>
       </LANGUAGENAME.LIST>
     </LEDGER>
    </TALLYMESSAGE>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;
}

app.post("/api/tally/auto-ledger", async (req, res) => { 
  const { name, type } = req.body; 
  if (!name || !type) { 
    return res.status(400).json({ error: "name and type required" }); 
  } 
  
  const parentMap = { 
    customer: "Sundry Debtors", 
    vendor: "Sundry Creditors",
    income: "Indirect Incomes", 
    expense: "Indirect Expenses", 
  }; 
  
  const parent = parentMap[type]; 
  if (!parent) { 
    return res.status(400).json({ error: "invalid type" }); 
  } 
  
  try { 
    const groups = await getAllGroupNames().catch(err => {
      console.warn("Could not fetch groups:", err.message);
      return [];
    });
    if (groups.length && !groups.includes(String(parent).toLowerCase())) {
      return res.status(400).json({ error: `Parent group "${parent}" not found in Tally` });
    }
    const existing = await getAllLedgerNames().catch(err => { 
      console.warn("Could not fetch existing ledgers:", err.message); 
      return []; // If we can't check, proceed anyway 
    }); 
    
    if (existing.includes(String(name).toLowerCase())) { 
      return res.json({ created: false, message: "Ledger already exists" }); 
    } 
    
    const xml = createLedgerXml({ name, parent });
    const sendPromise = sendToTally(xml, { timeoutMs: 60000, retries: 0 });
    const fallback = new Promise((resolve) => setTimeout(() => resolve({ __fallback: true }), 12000));
    const tallyResult = await Promise.race([sendPromise, fallback]);
    if (tallyResult && tallyResult.__fallback) {
      setTimeout(async () => {
        try {
          const after = await getAllLedgerNames();
          if (!after.includes(String(name).toLowerCase())) {
            console.warn(`Ledger "${name}" not found after early fallback`);
          } else {
            console.log(`Ledger "${name}" verified after early fallback`);
          }
        } catch (e) {
          console.warn("Early fallback verification failed:", e.message);
        }
      }, 1500);
      return res.json({
        created: false,
        ledger: name,
        parent,
        warning: "Tally did not respond; result unknown. Please refresh to verify"
      });
    }
    const respText = typeof tallyResult === 'string' ? tallyResult : JSON.stringify(tallyResult);
    console.log("RAW TALLY RESPONSE:\n", respText);
    let parsed;
    try {
      parsed = await parser.parseStringPromise(respText);
    } catch {
      parsed = null;
    }
    const lineError =
      parsed?.ENVELOPE?.BODY?.LINEERROR ||
      null;
    if (lineError) {
      return res.status(400).json({ error: 'Tally rejected ledger creation', details: String(lineError).slice(0, 500) });
    }
    const createdNode =
      parsed?.ENVELOPE?.BODY?.DATA?.RESPONSE?.CREATED ??
      parsed?.ENVELOPE?.BODY?.RESPONSE?.CREATED ??
      null;
    const errorsNode =
      parsed?.ENVELOPE?.BODY?.DATA?.RESPONSE?.ERRORS ??
      parsed?.ENVELOPE?.BODY?.RESPONSE?.ERRORS ??
      null;
    const createdOk = String(createdNode || '').trim() === '1' || respText.includes('<CREATED>1</CREATED>');
    const errorsZero = String(errorsNode || '').trim() === '0' || respText.includes('<ERRORS>0</ERRORS>');
    if (createdOk && errorsZero) {
      return res.json({ created: true, ledger: name, parent, message: "Ledger created successfully" });
    }
    setTimeout(async () => {
      try {
        const after = await getAllLedgerNames();
        if (!after.includes(String(name).toLowerCase())) {
          console.warn(`Ledger "${name}" not found after response`);
        } else {
          console.log(`Ledger "${name}" verified after response`);
        }
      } catch (e) {
        console.warn("Post-response verification failed:", e.message);
      }
    }, 1200);
    res.json({ created: false, ledger: name, parent, message: "Tally did not confirm creation; result unknown. Please refresh to verify" });
    
  } catch (err) { 
    console.error("Auto-ledger error:", err); 
    
    if (err.code === 'ECONNREFUSED') { 
      return res.status(503).json({ 
        error: "Tally is not running or unreachable", 
        details: "Please ensure Tally is open and port 9000 is accessible" 
      }); 
    } 
    
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) { 
      setTimeout(async () => { 
        try { 
          const after = await getAllLedgerNames(); 
          if (!after.includes(String(name).toLowerCase())) { 
            console.warn(`Ledger "${name}" not found after timeout`); 
          } else { 
            console.log(`Ledger "${name}" confirmed after timeout`); 
          } 
        } catch (e) { 
          console.warn("Post-timeout verification failed:", e.message); 
        } 
      }, 1500); 
      return res.json({ 
        created: false, 
        ledger: name, 
        parent, 
        warning: "Tally did not respond; result unknown. Please refresh to verify" 
      }); 
    } 
    
    res.status(500).json({ 
      error: err.message || "Failed to create ledger", 
      code: err.code 
    }); 
  } 
});

/**
 * Get Ledger List
 */
app.get("/api/tally/ledgers", async (req, res) => {
  const xml = `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>LedgerCollection</ID>
  </HEADER>

  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCOMPANY>$$SysName:CurrentCompany</SVCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>

      <TDL>
        <TDLMESSAGE>
          <SYSTEM TYPE="Formulae" NAME="IsNotGroup">
            NOT $$IsGroup
          </SYSTEM>
          <COLLECTION NAME="LedgerCollection">
            <TYPE>Ledger</TYPE>
            <FETCH>Name,Parent,OpeningBalance</FETCH>
            <FILTER>IsNotGroup</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

  try {
    const xmlResponse = await sendToTally(xml);
    const json = await parser.parseStringPromise(xmlResponse);
    res.json(json);
  } catch (err) {
    console.error("Tally Ledger Error:", err);
    res.status(500).send(err.message);
  }
});

app.post("/api/tally/sales", async (req, res) => {
  const { party, amount } = req.body;

  const xml = `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Vouchers</REPORTNAME>
   </REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE>
     <VOUCHER VCHTYPE="Sales" ACTION="Create">
      <DATE>20260101</DATE>
      <PARTYLEDGERNAME>${party}</PARTYLEDGERNAME>
      <VOUCHERNUMBER>1</VOUCHERNUMBER>
      <ALLLEDGERENTRIES.LIST>
       <LEDGERNAME>${party}</LEDGERNAME>
       <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
       <AMOUNT>-${amount}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
     </VOUCHER>
    </TALLYMESSAGE>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;

  try {
    const response = await sendToTally(xml);
    res.send(response);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/tally/health", async (req, res) => {
  try {
    const xml = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
    const startTime = Date.now();
    await sendToTally(xml, { timeoutMs: 5000, retries: 0 });
    const responseTime = Date.now() - startTime;
    res.json({
      status: 'connected',
      responseTime: `${responseTime}ms`,
      message: 'Tally is running and responsive'
    });
  } catch (err) {
    res.status(503).json({
      status: 'disconnected',
      error: err.message,
      message: 'Tally is not running or unreachable on port 9000'
    });
  }
});

app.post("/api/tally/fix-ledgers", async (req, res) => {
  const xml = `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Ledgers</REPORTNAME>
    <STATICVARIABLES>
      <SVCOMPANY>$$SysName:CurrentCompany</SVCOMPANY>
    </STATICVARIABLES>
   </REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE>
      <LEDGER NAME="ABC Traders" ACTION="Alter">
        <PARENT>Sundry Debtors</PARENT>
      </LEDGER>
    </TALLYMESSAGE>
    <TALLYMESSAGE>
      <LEDGER NAME="Sales" ACTION="Alter">
        <PARENT>Sales Accounts</PARENT>
      </LEDGER>
    </TALLYMESSAGE>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>`;

  try {
    const importResponse = await sendToTally(xml);

    const verifyXml = `
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>LedgerCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVCOMPANY>$$SysName:CurrentCompany</SVCOMPANY>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <SYSTEM TYPE="Formulae" NAME="IsNotGroup">
            NOT $$IsGroup
          </SYSTEM>
          <COLLECTION NAME="LedgerCollection">
            <TYPE>Ledger</TYPE>
            <FETCH>Name,Parent</FETCH>
            <FILTER>IsNotGroup</FILTER>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

    const xmlResponse = await sendToTally(verifyXml);
    const parsed = await parser.parseStringPromise(xmlResponse);

    const results = [];
    const targetNames = new Set(["ABC Traders", "Sales"]);
    const stack = [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (node && typeof node === "object") {
        if (node.LEDGER) {
          const ledgers = Array.isArray(node.LEDGER) ? node.LEDGER : [node.LEDGER];
          for (const l of ledgers) {
            const name = l.NAME || (l.$ && l.$.NAME) || null;
            const parent = l.PARENT || (l.$ && l.$.PARENT) || null;
            if (name && targetNames.has(name)) {
              results.push({ name, parent });
              targetNames.delete(name);
            }
          }
        }
        for (const key of Object.keys(node)) {
          stack.push(node[key]);
        }
      }
    }

    res.json({ importResponse, verification: results });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Attempt to connect to DB on start
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const email = 'admin@system.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: randomUUID(),
          schoolId: null,
          firstName: 'Super',
          lastName: 'Admin',
          email,
          password: 'Admin@123',
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Super admin inserted:', email);
    } else {
      await prisma.user.update({
        where: { email },
        data: {
          schoolId: null,
          firstName: existing.firstName || 'Super',
          lastName: existing.lastName || 'Admin',
          password: 'Admin@123',
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Super admin updated:', email);
    }
    
    server.listen(PORT,'0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
