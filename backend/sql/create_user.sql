-- Executed automatically by the mysql container on first start
-- (mounted into /docker-entrypoint-initdb.d, see docker-compose.yml).
--
-- The database name must match the one used in SQLALCHEMY_DATABASE_URI, e.g.
--   SQLALCHEMY_DATABASE_URI=mysql+pymysql://root:<MYSQL_ROOT_PASSWORD>@db:3306/spark
CREATE DATABASE IF NOT EXISTS spark;
USE spark;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account VARCHAR(80) NOT NULL,
    category INT NOT NULL,
    password VARCHAR(80) NOT NULL,
    UNIQUE (account)
);

-- !!! Change these credentials before deploying to production !!!
-- The account named in ADMIN_ACCOUNT (default: root) becomes the admin.
INSERT INTO users (account, category, password) VALUES ('root', 0, SHA2('root', 256));
INSERT INTO users (account, category, password) VALUES ('test', 1, SHA2('test', 256));
