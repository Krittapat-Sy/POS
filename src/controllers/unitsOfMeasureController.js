const pool = require('../config/db');

exports.createUnitOfMeasure = async (req, res) => {
    const { unitName, unitAbbreviation } = req.body;
    if (!unitName || !unitAbbreviation) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });

    const connection = await pool.getConnection();
    try {
        const [[nameDup]] = await connection.query(
            'SELECT 1 FROM unitsofmeasure WHERE unit_name = ? LIMIT 1',
            [unitName]
        );
        if (nameDup) {
            return res.status(409).json({ message: 'ชื่อหน่วยนับนี้มีอยู่ในระบบแล้ว!' });
        }

        const [[abbrDup]] = await connection.query(
            'SELECT 1 FROM unitsofmeasure WHERE unit_abbreviation = ? LIMIT 1',
            [unitAbbreviation]
        );
        if (abbrDup) {
            return res.status(409).json({ message: 'ตัวย่อหน่วยนับนี้มีอยู่ในระบบแล้ว!' });
        }

        await connection.query(`
            insert into unitsofmeasure (unit_name, unit_abbreviation)
            values (?, ?)
            `,
            [unitName, unitAbbreviation]);

        return res.status(201).json({
            message: 'เพิ่มหน่วยนับสำเร็จ!',
            data: { unitName, unitAbbreviation }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during unitOfMeasure creation.' });
    } finally {
        connection.release()
    }
};

exports.getAllUnitsOfMeasure = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const [unitOfMeasure] = await connection.query(`
            select unit_id, unit_name, unit_abbreviation
            from unitsofmeasure
            `
        );
        res.status(200).json(unitOfMeasure);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching categories.' });
    } finally {
        connection.release()
    }
};

exports.getUnitOfMeasureById = async (req, res) => {
    const { unitId } = req.params;
    if (!unitId) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });

    const connection = await pool.getConnection();
    try {
        const [Uom] = await connection.query(`
            select unit_id, unit_name, unit_abbreviation
            from unitsofmeasure
            where unit_id = ?
            `,
            [unitId]
        )
        if (Uom.length == 0) return res.status(404).json({ message: 'ไม่พบข้อมูล!' });

        res.status(200).json(Uom)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching categories.' });
    } finally {
        connection.release();
    }
};

exports.updateUnitOfMeasure = async (req, res) => {
    const { unitId, unitName, unitAbbreviation } = req.body;
    if (!unitId) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด!' });

    if (unitName == '') {
        return res.status(400).json({ message: 'ชื่อหน่วยนับห้ามว่าง!' });
    } else if (unitAbbreviation == '') {
        return res.status(400).json({ message: 'ตัวย่อหน่วยนับห้ามว่าง!' });
    };

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(`
            select unit_id, unit_name, unit_abbreviation 
            from unitsofmeasure 
            where unit_id = ?
            `,
            [unitId]
        )

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบหน่วยนับที่ระบุ' });
        }

        const current = rows[0];

        const newUnitName = unitName ?? current.unit_name;
        const newUnitAbbreviation = unitAbbreviation ?? current.unit_abbreviation;


        if (newUnitName == current.unit_name && newUnitAbbreviation === current.unit_abbreviation) {
            return res.status(200).json({
                message: 'ไม่มีการเปลี่ยนแปลง',
                data: { unitId, unitName: newUnitName, newUnitAbbreviation: newUnitAbbreviation }
            });
        }

        const [[unitNameDup]] = await connection.query(
            'select 1 from unitsofmeasure where unit_name = ? and unit_id <> ?',
            [newUnitName, unitId]
        );
        if (unitNameDup) {
            return res.status(409).json({ message: 'ชื่อหน่วยนับนี้มีอยู่ในระบบแล้ว!' });
        }

        const [[abbrDup]] = await connection.query(
            'select 1 from unitsofmeasure where unit_abbreviation = ? and unit_id <> ?',
            [newUnitAbbreviation, unitId]
        );
        if (abbrDup) {
            return res.status(409).json({ message: 'ตัวย่อหน่วยนับนี้มีอยู่ในระบบแล้ว!' });
        }

        await connection.query(
            'update unitsofmeasure set unit_name = ?, unit_abbreviation = ? where unit_id = ?',
            [newUnitName, newUnitAbbreviation, unitId]
        );

        return res.status(200).json({
            message: 'แก้ข้อมูลสำเร็จ!',
            data: { unitId, unitName: newUnitName, unitAbbreviation: newUnitAbbreviation }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while update categorie.' });
    } finally {
        connection.release();
    }
};

exports.deleteUnitOfMeasure = async (req, res) => {
    const { unitId } = req.params;
    if (!unitId) return res.status(400).json({ message: 'กรุณาป้อนข้อมูลให้ครบตามที่กำหนด' });

    const connection = await pool.getConnection();
    try {
        const [result] = await connection.query(`
            delete from unitsofmeasure where unit_id = ?
            `,
            [unitId]
        )

        if (result.affectedRows == 0) return res.status(404).json({ message: 'ไม่พบข้อมูลที่ต้องการลบ' });

        res.status(200).json({ message: 'ลบข้อมูลร้อยแล้ว!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while delete categories.' });
    } finally {
        connection.release()
    }
};