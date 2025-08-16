require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const usersRoutes = require('./routes/usersRoutes');

const app = express();

// Middleware
const corsOptions = {
    origin: 'http://localhost:4200', // URL ของ Angular App
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/users', usersRoutes);


const PORT = process.env.PORT | 4000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

