-- Add the isAdmin column to the Users table
ALTER TABLE Users
ADD COLUMN isAdmin BOOLEAN DEFAULT FALSE;

