#####
# 
# Database Declaration
# 
#####

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://계정:정보@localhost/sacplay?charset=utf8mb4"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={}, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
