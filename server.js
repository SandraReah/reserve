const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data for tables and reservations
const tables = [
    { id: 1, seats: 4, isReserved: false },
    { id: 2, seats: 2, isReserved: false },
    { id: 3, seats: 6, isReserved: false },
    { id: 4, seats: 4, isReserved: false },
    { id: 5, seats: 8, isReserved: false },
];

const reservations = [];
let nextReservationId = 1;

// Helper function to find a table by ID
const findTable = (id) => tables.find(table => table.id === parseInt(id));

// GET /tables - Display available tables
app.get('/tables', (req, res) => {
    const availableTables = tables.filter(table => !table.isReserved);
    res.json(availableTables);
});

// POST /reserve - Reserve a table
app.post('/reserve', (req, res) => {
    const { tableNumber, customerName, guestCount } = req.body;

    if (!customerName || !guestCount) {
        return res.status(400).json({ error: "Name and guest count required" });
    }

    const tableToReserve = findTable(tableNumber);

    if (!tableToReserve) {
        return res.status(404).json({ error: `Table ${tableNumber} not found.` });
    }

    if (tableToReserve.isReserved) {
        return res.status(400).json({ error: `Table ${tableNumber} is already reserved.` });
    }

    if (tableToReserve.seats < parseInt(guestCount)) {
        return res.status(400).json({ error: `No available tables for ${guestCount} guests.` });
    }

    tableToReserve.isReserved = true;
    const reservation = {
        id: nextReservationId++,
        tableNumber: parseInt(tableNumber),
        customerName,
        guestCount: parseInt(guestCount),
        time: new Date().toLocaleString() // Simple timestamp
    };
    reservations.push(reservation);

    // Corrected success message:
    res.status(201).json({ success: `Table ${tableNumber} reserved for ${customerName} (${guestCount} guests)`, reservationId: reservation.id });
});
// GET /reservations - View all reservations
app.get('/reservations', (req, res) => {
    res.json(reservations);
});

// PUT /update/:id - Modify a reservation
app.put('/update/:id', (req, res) => {
    const reservationId = parseInt(req.params.id);
    const { tableNumber, customerName, guestCount, time } = req.body;
    const reservationIndex = reservations.findIndex(res => res.id === reservationId);

    if (reservationIndex === -1) {
        return res.status(404).json({ error: `Reservation with ID ${reservationId} not found.` });
    }

    const updatedReservation = {
        ...reservations[reservationIndex],
        ...(tableNumber !== undefined && { tableNumber: parseInt(tableNumber) }),
        ...(customerName !== undefined && { customerName }),
        ...(guestCount !== undefined && { guestCount: parseInt(guestCount) }),
        ...(time !== undefined && { time })
    };

    // Basic check if the new table is available (you might need more complex logic)
    if (updatedReservation.tableNumber !== reservations[reservationIndex].tableNumber) {
        const newTable = findTable(updatedReservation.tableNumber);
        if (!newTable || (newTable.isReserved && newTable.id !== reservations[reservationIndex].tableNumber)) {
            return res.status(400).json({ error: `Table ${updatedReservation.tableNumber} is not available.` });
        }
        // Revert the old table's reservation status (simplistic approach)
        const oldTable = findTable(reservations[reservationIndex].tableNumber);
        if (oldTable) oldTable.isReserved = false;
        newTable.isReserved = true;
    }

    reservations[reservationIndex] = updatedReservation;
    res.json({ success: `Reservation ${reservationId} updated successfully.` });
});

// DELETE /cancel/:id - Cancel a reservation
app.delete('/cancel/:id', (req, res) => {
    const reservationId = parseInt(req.params.id);
    const reservationIndex = reservations.findIndex(res => res.id === reservationId);

    if (reservationIndex === -1) {
        return res.status(404).json({ error: `Reservation with ID ${reservationId} not found.` });
    }

    const cancelledReservation = reservations.splice(reservationIndex, 1)[0];
    const tableToUnreserve = findTable(cancelledReservation.tableNumber);
    if (tableToUnreserve) {
        tableToUnreserve.isReserved = false;
    }

    res.json({ success: `Reservation ${reservationId} cancelled successfully.` });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});