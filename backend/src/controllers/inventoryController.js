import { randomUUID } from 'node:crypto';
import prisma from '../config/db.js';

export const getInventoryItems = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const items = await prisma.inventoryItem.findMany({
            where: { schoolId },
            orderBy: { name: 'asc' }
        });
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
};

export const createInventoryItem = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { name, category, quantity, unit, minStock, location } = req.body;

        const item = await prisma.inventoryItem.create({
            data: {
                id: randomUUID(),
                schoolId,
                name,
                category,
                quantity: parseInt(quantity) || 0,
                unit,
                minStock: parseInt(minStock) || 0,
                location
            }
        });
        res.status(201).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create item' });
    }
};

export const updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        // Sanitize integers
        if(data.quantity) data.quantity = parseInt(data.quantity);
        if(data.minStock) data.minStock = parseInt(data.minStock);

        const item = await prisma.inventoryItem.update({
            where: { id },
            data
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
    }
};

export const deleteInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.inventoryItem.delete({ where: { id } });
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

export const recordTransaction = async (req, res) => {
    try {
        const { schoolId, id: userId } = req.user;
        const { itemId, type, quantity, notes } = req.body;
        const qty = parseInt(quantity);

        if (qty <= 0) return res.status(400).json({ error: 'Quantity must be positive' });

        // Update item quantity atomically
        const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        if (type === 'OUT' && item.quantity < qty) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        const newQuantity = type === 'IN' 
            ? item.quantity + qty 
            : type === 'OUT' 
                ? item.quantity - qty 
                : qty; // ADJUSTMENT sets the absolute value (simplified logic, usually adjustment is difference but here let's assume UI sends diff or we set absolute. Let's assume ADJ is just setting it? Or maybe +/-. Let's stick to simple flow: IN/OUT changes relative. ADJ could be absolute reset? Let's treat ADJ as relative change too for now or better, absolute set is safer but complex to track 'diff'. Let's stick to IN/OUT mainly. If type is ADJUSTMENT, let's say it's an absolute set, so we calculate diff.)

        let updateData = {};
        if (type === 'IN') updateData = { quantity: { increment: qty } };
        else if (type === 'OUT') updateData = { quantity: { decrement: qty } };
        else if (type === 'ADJUSTMENT') updateData = { quantity: qty }; // Absolute set

        const [updatedItem, transaction] = await prisma.$transaction([
            prisma.inventoryItem.update({
                where: { id: itemId },
                data: updateData
            }),
            prisma.inventoryTransaction.create({
                data: {
                    id: randomUUID(),
                    itemId,
                    userId,
                    type,
                    quantity: qty,
                    notes
                }
            })
        ]);

        res.json({ item: updatedItem, transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to record transaction' });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { itemId } = req.params;
        const transactions = await prisma.inventoryTransaction.findMany({
            where: { itemId },
            include: { user: { select: { firstName: true, lastName: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
