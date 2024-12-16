from database import Base
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
import bcrypt
import hashlib
from typing import Optional
from sqlalchemy import desc
from datetime import date, datetime, timezone, timedelta
KST = timezone(timedelta(hours=9))

def get_hashed_password(plain_text_password: str):
    return bcrypt.hashpw(plain_text_password.encode('utf-8'), bcrypt.gensalt())

def check_password(plain_text_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_text_password.encode('utf-8'), hashed_password.encode('utf-8'))

class Users(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True} 

    uid = Column(String(30), primary_key=True, index=True)
    email = Column(String(30), unique=True, index=True)
    name = Column(String(30))
    
    account_number = Column(String(30), unique=True)
    balance = Column(Integer)

    transactions = relationship("Transactions", back_populates="owner")
    sessions = relationship("Sessions", back_populates="owner")
    tokens = relationship("Tokens", back_populates="owner")
    baseball = relationship("Baseball", back_populates="owner")


class Admins(Base):
    __tablename__ = "admins"
    __table_args__ = {'extend_existing': True} 

    uid = Column(String(30), primary_key=True, index=True) # ####-##-####  // sell give dual admin auto su
    pw = Column(String(200))
    name = Column(String(30)) # name of booth
    actype = Column(Integer) # 1: seller, 2: program, 8: artandculture, 64: superuser

    sessions = relationship("Asessions", back_populates="owner")


class Asessions(Base):
    __tablename__ = "asessions"
    __table_args__ = {'extend_existing': True} 

    sid = Column(String(100), primary_key=True, index=True)
    owner_id = Column(String(30), ForeignKey("admins.uid"))
    timestamp = Column(DateTime)

    owner = relationship("Admins", back_populates="sessions")


class Transactions(Base):
    __tablename__ = "transactions"
    __table_args__ = {'extend_existing': True} 

    id = Column(Integer, primary_key=True)
    tid = Column(String(30), index=True)
    owner_id = Column(String(30), ForeignKey("users.uid"))
    timestamp = Column(DateTime)

    amount = Column(Integer)
    description = Column(String(100))

    issuer_type = Column(Integer) # 1: 송금(개인) 2: 판매자 3: 참가보상 4: 상금 5: 기타 7: 시스템
    issued_by = Column(String(30), nullable=True)

    approved = Column(Boolean, default=False)
    approved_by = Column(String(30))
    approved_at = Column(DateTime, nullable=True)

    owner = relationship("Users", back_populates="transactions")


class Sessions(Base):
    __tablename__ = "sessions"
    __table_args__ = {'extend_existing': True} 

    sid = Column(String(100), primary_key=True, index=True)
    owner_id = Column(String(30), ForeignKey("users.uid"))
    timestamp = Column(DateTime)

    owner = relationship("Users", back_populates="sessions")


class Tokens(Base):
    __tablename__ = "tokens"
    __table_args__ = {'extend_existing': True} 

    tid = Column(String(100), primary_key=True, index=True)
    owner_id = Column(String(30), ForeignKey("users.uid"))
    timestamp = Column(DateTime)

    owner = relationship("Users", back_populates="tokens")


class Pending(Base):
    __tablename__ = "pending"
    __table_args__ = {"extend_existing": True}

    tid = Column(String(30), primary_key=True, index=True)


class Scanrec(Base):
    __tablename__ = "scanrec"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    sid = Column(String(100))
    timestamp = Column(DateTime)
    tid = Column(String(100))


class Treasures(Base):
    __tablename__ = "treasures"
    __table_args__ = {'extend_existing': True} 

    tid = Column(String(100), primary_key=True, index=True)
    active = Column(Boolean, default=True)
    pos = Column(String(10))
    amnt1 = Column(Integer)
    amnt2 = Column(Integer)
    redeem = Column(Integer)
    uid = Column(String(15000), nullable=True)


class Baseball(Base):
    __tablename__ = "baseball"
    __table_args__ = {'extend_existing': True} 

    sess = Column(String(30), primary_key=True, index=True)
    owner_id = Column(String(30), ForeignKey("users.uid"))
    done = Column(Boolean, default=False)
    ans = Column(Integer)
    time = Column(Integer, default=0)
    
    owner = relationship("Users", back_populates="baseball")


#####
# 
# CRUD
# 
#####

from sqlalchemy.orm import Session
import string
import random
import json
import hashlib
from pydantic import BaseModel

def baseb_start(db: Session, usr: Users, tid: str):
    l = list("0123456789")
    a = True
    while a:
        random.shuffle(l)
        if random.random()>(int(l[0])/10):
            a = False
    db_item = Baseball(sess=tid,
        owner_id=usr.uid,
        ans=int("".join(l[:4]))
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def baseb_check(db: Session, tid: str):
    return db.query(Baseball).filter(Baseball.sess == tid).first() is None

def baseb_guess(db: Session, tid: str, g: int):
    i = db.query(Baseball).filter(Baseball.sess == tid).first()
    if i.done: return -1, -1
    db.query(Baseball).filter(Baseball.sess == tid).update({"time": i.time+1})
    db.commit()
    if i.ans==g:
        db.query(Baseball).filter(Baseball.sess == tid).update({"done": True})
        db.commit()
        return 4, i.time
    if i.time>=20:
        db.query(Baseball).filter(Baseball.sess == tid).update({"done": True})
        db.commit()
        return 5, i.time
    ans = list(str(i.ans).zfill(4))
    guess = list(str(g).zfill(4))
    strike, ball = 0, 0
    for i in range(4):
        if ans[i]==guess[i]:
            strike += 1
        elif guess[i] in ans:
            ball += 1
    return strike, ball

def baseb_getans(db: Session, tid: str):
    return db.query(Baseball).filter(Baseball.sess == tid).first().ans

def get_user_by_uid(db: Session, uid: str):
    return db.query(Users).filter(Users.uid == uid).first()

def get_user_by_ano(db: Session, ano: str):
    return db.query(Users).filter(Users.account_number == ano).first()

def get_user_by_email(db: Session, email: str):
    return db.query(Users).filter(Users.email == email).first()

def get_user_by_name(db: Session, name: str):
    return db.query(Users).filter(Users.name == name).first()

def get_name(stuid: str):
    dic = json.loads(open("static/stu.json", "r", encoding="utf-8").read())
    return dic[stuid]

def get_name_E(stuid: str):
    dic = json.loads(open("static/special.json", "r", encoding="utf-8").read())
    return dic[stuid]

def create_user(db: Session, email: str):
    uid = "".join([random.choice(string.ascii_letters + string.digits) for _ in range(20)])
    while get_user_by_uid(db, uid) is not None:
        uid = "".join([random.choice(string.ascii_letters + string.digits) for _ in range(20)])
    ano = "".join([random.choice(string.digits) for _ in range(8)])
    while get_user_by_ano(db, ano) is not None:
        ano = "".join([random.choice(string.digits) for _ in range(8)])
    try: get_name(email[:6])
    except:
        try: get_name_E(email)
        except: return None
    db_user = Users(uid=uid, email=email, name=get_name(email[:6]),
            account_number=ano, balance=0
        )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def login(db: Session, email: str):
    usr = get_user_by_email(db, email)
    if usr is None:
        usr = create_user(db, email)
    if usr is None:
        return None
    db_item = Sessions(owner_id=usr.uid,
        timestamp=datetime.now(KST),
        sid=hashlib.sha256((email+str(datetime.now(KST).timestamp())).encode('utf-8')).hexdigest(),
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def verify_session(db: Session, sid: str):
    db.query(Sessions).filter(Sessions.timestamp<=(datetime.now(KST)-timedelta(hours=24))).delete()
    sess = db.query(Sessions).filter(Sessions.sid == sid).first()
    return sess

def verify_asession(db: Session, sid: str):
    db.query(Asessions).filter(Asessions.timestamp<=(datetime.now(KST)-timedelta(hours=24))).delete()
    sess = db.query(Asessions).filter(Asessions.sid == sid).first()
    return sess

class TransactionBase(BaseModel):
    owner_id: str
    amount: int
    description: str
    issuer_type: int
    issued_by: str
    approved: bool
    approved_by: str

def aprv(db: Session, tid: str, aprv_by: str):
    trans = db.query(Transactions).filter(Transactions.tid==tid)
    if trans.first().approved: return None
    trans.update({"approved": True, "approved_by": aprv_by, "approved_at": datetime.now(KST)})
    db.commit()
    p_pop(db, tid)
    trans = trans.first()
    update_balance(db, trans.owner, trans.amount)
    return trans

def deny(db: Session, tid: str, aprv_by: str):
    trans = db.query(Transactions).filter(Transactions.tid==tid)
    trans.update({"approved_by": "cancel", "approved_at": datetime.now(KST)})
    db.commit()
    p_pop(db, tid)
    return trans

def generate_transaction(db: Session, trans: TransactionBase, t: Optional[Transactions]):
    if t is None:
        tid = "".join([random.choice(string.ascii_lowercase + string.digits) for _ in range(16)])
        while db.query(Transactions).filter(Transactions.tid == tid).first() is not None:
            tid = "".join([random.choice(string.ascii_lowercase + string.digits) for _ in range(16)])
        db_item = Transactions(**trans.dict(),
            tid=tid,
            timestamp=datetime.now(KST),
        )
    else:
        db_item = Transactions(**trans.dict(),
            tid=t.tid,
            timestamp=t.timestamp,
        )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_trans(db: Session, tid: str):
    return db.query(Transactions).filter(Transactions.tid==tid).first()

def update_balance(db: Session, usr: Users, amnt: int):
    db.query(Users).filter(Users.uid == usr.uid).update({'balance': usr.balance+amnt})
    db.commit()

def get_token(db: Session, usr: Users):
    tkns = db.query(Tokens).filter(Tokens.owner_id == usr.uid).filter(Tokens.timestamp>(datetime.now(KST)-timedelta(seconds=30)))
    db.query(Tokens).filter(Tokens.owner_id == usr.uid).filter(Tokens.timestamp<=(datetime.now(KST)-timedelta(seconds=30))).delete()
    if tkns:
        if tkns.count()>=5: return tkns.order_by(Tokens.timestamp.desc()).first()
    tid = (hashlib.sha256((usr.uid+str(datetime.now(KST).timestamp())).encode('utf-8')).hexdigest())[:10]
    while db.query(Tokens).filter(Tokens.tid==tid).first():
        tid = (hashlib.sha256((usr.uid+str(datetime.now(KST).timestamp())).encode('utf-8')).hexdigest())[:10]
    ntkn = Tokens(tid=tid,
        owner_id=usr.uid, timestamp=datetime.now(KST))
    db.add(ntkn)
    db.commit()
    db.refresh(ntkn)
    return ntkn

def giftcheck(db: Session, usr: Users):
    trans = db.query(Transactions).filter(Transactions.issued_by == "AUTO-01-GIFT").filter(Transactions.timestamp>(datetime.now(KST).date())).filter(Transactions.owner_id == usr.uid).first()
    if trans: return False
    return True

def givecheck(db: Session, usr: Users, adm: Admins):
    trans = db.query(Transactions).filter(Transactions.issued_by == adm.uid).filter(Transactions.owner_id == usr.uid).filter(Transactions.issuer_type == 3).first()
    if trans: return False
    return True

def query_token(db: Session, tkn: str):
    return db.query(Tokens).filter(Tokens.tid==tkn).first()

def add_admin(db: Session, uid: str, pw: str, name: str, actype: int):
    nadm = Admins(uid=uid, pw=get_hashed_password(pw), name=name, actype=actype)
    db.add(nadm)
    db.commit()
    db.refresh(nadm)
    return nadm

def update_admin(db: Session, uid: str, pw: str = None, name: str = None):
    upd = {}
    if pw: upd["pw"] = get_hashed_password(pw)
    if name: upd["name"] = name
    db.query(Admins).filter(Admins.uid == uid).update(upd)
    db.commit()

def get_admin(db: Session):
    return db.query(Admins).filter(Admins.actype==1).all(),db.query(Admins).filter(Admins.actype==2).all()

def delete_admin(db: Session, uid: str):
    db.query(Admins).filter(Admins.uid == uid).delete()
    db.commit()

def admin_login(db: Session, uid: str, pw: str):
    usr = db.query(Admins).filter(Admins.uid == uid).first()
    if usr is None: return None
    if check_password(pw, usr.pw):
        db_item = Asessions(owner_id=uid,
            timestamp=datetime.now(KST),
            sid=hashlib.sha256((uid+str(datetime.now(KST).timestamp())+"admin").encode('utf-8')).hexdigest(),
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    else:
        return None

def p_append(db: Session, tid: str):
    db_item = Pending(tid=tid)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def p_pop(db: Session, tid: str):
    db.query(Pending).filter(Pending.tid==tid).delete()
    db.commit()

def p_all(db: Session):
    return db.query(Pending).all()

def s_add(db: Session, sid: str, tid: str):
    if db.query(Tokens).filter(Tokens.tid==tid).first() is None: return None
    db_item = Scanrec(sid=sid, tid=tid, timestamp=datetime.now(KST))
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def s_get(db: Session, sid: str):
    l = db.query(Scanrec).filter(Scanrec.sid == sid).order_by(desc(Scanrec.timestamp)).first()
    if l is None: return None
    r = l.tid, l.timestamp
    db.query(Scanrec).filter(Scanrec.sid == sid).delete()
    db.commit()
    return r

def abc(db: Session, type: int):
    if type==1:
        return db.query(Users).order_by(Users.email).all()
    if type==2:
        return db.query(Transactions).filter((Transactions.issuer_type==3)|(Transactions.issuer_type==7)).all()
    if type==3:
        return db.query(Transactions).filter(Transactions.issuer_type==2).all()

def statics(db: Session, adm: Admins, typ: int):
    return db.query(Transactions).filter(Transactions.issued_by == adm.uid).filter((Transactions.issuer_type==typ)).all()

def adm_uid_to_name(db: Session, uid: str):
    return db.query(Admins).filter(Admins.uid == uid).first().name

def t_append(db: Session, pos: str, amnt1: str, amnt2: str):
    tid = hashlib.sha256(("new treasure!"+str(datetime.now(KST).timestamp())).encode('utf-8')).hexdigest()
    db_item = Treasures(tid=tid, pos=pos, amnt1=int(amnt1), amnt2=int(amnt2), redeem=0)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def t_get(db: Session, tid: str):
    return db.query(Treasures).filter(Treasures.tid==tid).first()

def t_use(db: Session, tid: str, u: Users):
    tt = t_get(db, tid)
    trans = TransactionBase(
        owner_id=u.uid, amount=tt.amnt2 if tt.redeem>=2 else tt.amnt1, description=f"보물 발견",
        issuer_type=7, issued_by=u.uid,
        approved=True, approved_by="system"
    )
    db.query(Treasures).filter(Treasures.tid==tid).update({"redeem": tt.redeem+1, "uid": tt.uid+","+u.uid if tt.uid else u.uid})
    tt = generate_transaction(db, trans, None)
    update_balance(db, tt.owner, tt.amount)
    db.commit()
    return tt

def t_all(db: Session):
    return db.query(Treasures).all()

def t_del(db: Session, tid: str):
    db.query(Treasures).filter(Treasures.tid==tid).update({"active": False})
    db.commit()
