import math
import random
import os
import traceback
from typing import Optional
from fastapi import FastAPI, Form, Request, Response, UploadFile, Depends
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, RedirectResponse, PlainTextResponse, Response
from pydantic import BaseModel, FilePath
from fastapi.exceptions import FastAPIError, HTTPException, RequestValidationError
import json
import asyncio
from datetime import date, datetime, timezone, timedelta
import hashlib
import requests
import re
import string
from oauthlib.oauth2 import WebApplicationClient
from database import engine, SessionLocal, Base
from crud import abc, adm_uid_to_name, aprv, baseb_check, baseb_getans, baseb_guess, baseb_start, deny, get_hashed_password, givecheck, statics
from crud import get_trans, get_user_by_email, get_user_by_uid, p_all, query_token, s_add, s_get, verify_session
from crud import verify_asession, login, get_user_by_ano, generate_transaction, TransactionBase, update_balance, get_token
from crud import add_admin, get_admin, delete_admin, update_admin, admin_login, p_append, p_pop, giftcheck
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
KST = timezone(timedelta(hours=9))
START = datetime(year=2023, month=11, day=3, tzinfo=KST)

app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)

Base.metadata.create_all(bind=engine)

origins = [
    "https://play.sac.today",
    "https://dash.sac.today"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Dependency

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def checkSess(db: Session, request: Request):
    req = request.headers
    if "Authorization" not in req:
        return None
    if not req["Authorization"].startswith("Basic "):
        return None
    return verify_session(db, req["Authorization"].split("Basic ")[1])


def checkAdminSess(db: Session, request: Request):
    req = request.headers
    if "Authorization" not in req:
        return None
    if not req["Authorization"].startswith("Basic "):
        return None
    return verify_asession(db, req["Authorization"].split("Basic ")[1])


def content(file_path: str) -> str:
    if file_path[-2:] == "js":
        file_path = "js/"+file_path
    elif file_path[-3:] == "css":
        file_path = "css/"+file_path
    elif file_path[-4:] == "json":
        file_path = "json/"+file_path
    elif not file_path[-4:] == "html":
        raise Exception()
    with open(f"static/{file_path}", encoding="utf-8") as f:
        return f.read()


def reqp(r: Request):
    return r.headers["X-Real-IP"], r.url.path, r.method


#*# User API #*#


@app.post("/usr") #
def usr(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess:
        usr = sess.owner
        d = (datetime.now(KST)-START).days
        return JSONResponse(content={"result": 1, "email": usr.email, "name": usr.name, "ano": usr.account_number, "balance": usr.balance,
                                     "date": f"D{d}" if d<0 else f"{d+1}"})
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/rt") #
def rt(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess:
        usr = sess.owner
        tkn = get_token(db, usr)
        if tkn: return JSONResponse(content={"result": 1, "tid": tkn.tid, "timestamp": tkn.timestamp.timestamp()})
        else: return PlainTextResponse("E", status_code=502)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/qn") #
def qn(request: Request, db: Session = Depends(get_db), ano: str = Form(...)):
    sess = checkSess(db, request)
    if sess:
        usr = sess.owner
        if len(ano) != 8:
            return JSONResponse(content={"result": 0}, status_code=400)
        usr2 = get_user_by_ano(db, ano)
        if usr2 is None:
            return JSONResponse(content={"result": 0}, status_code=400)
        return JSONResponse(content={"result": 1, "email": usr2.email, "name": usr2.name})
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/startbb") #
def startbb(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess:
        usr = sess.owner
        if usr.balance >= 1000:
            trans = TransactionBase(
                owner_id=usr.uid, amount=-1000, description="숫자야구 게임",
                issuer_type=7, issued_by="AUTO-02-BASEB",
                approved=True, approved_by="system"
            )
            t = generate_transaction(db, trans, None)
            update_balance(db, usr, -1000)
            b = baseb_start(db, usr, t.tid)
            return JSONResponse(content={"result": 1, "tid": b.sess})
        else:
            return JSONResponse(content={"result": 0}, status_code=400)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/guessbb") #
def guessbb(request: Request, db: Session = Depends(get_db), tid: str = Form(...), guess: int = Form(...)):
    sess = checkSess(db, request)
    if sess:
        usr = sess.owner
        if not(0<=guess<9999): return JSONResponse(content={"result": 0}, status_code=400)
        if not len(set(list(str(guess).zfill(4))))==4: return JSONResponse(content={"result": 0}, status_code=400)
        if not baseb_check(db, tid):
            s, b = baseb_guess(db, tid, guess)
            if s==-1:
                return JSONResponse(content={"result": 0}, status_code=400)
            if s==5:
                trans = TransactionBase(
                    owner_id=usr.uid, amount=1, description="숫자야구 게임 보상",
                    issuer_type=7, issued_by="AUTO-02-BASEB",
                    approved=True, approved_by="system"
                )
                t = generate_transaction(db, trans, None)
                update_balance(db, usr, 1)
                return JSONResponse(content={"s": s, "b": b})
            if s==4:
                ratio = [-1,1,0.75,0.5,0.3,0.25,0.2,0.15,0.1,0.075,0.05,0.025,0,0,0,0,0,0,0,0,0]
                amnt = int(baseb_getans(db, tid)*ratio[b])
                trans = TransactionBase(
                    owner_id=usr.uid, amount=amnt, description="숫자야구 게임 보상",
                    issuer_type=7, issued_by="AUTO-02-BASEB",
                    approved=True, approved_by="system"
                )
                t = generate_transaction(db, trans, None)
                update_balance(db, usr, amnt)
                return JSONResponse(content={"s": s, "b": b})
            return JSONResponse(content={"s": s, "b": b})
        else:
            return JSONResponse(content={"result": 0}, status_code=400)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/sd") #
def sd(request: Request, db: Session = Depends(get_db), ano: str = Form(...), amnt: int = Form(...), desc: str = Form(...)):
    sess = checkSess(db, request)
    return JSONResponse(content={"result": 0}, status_code=400)
    if sess:
        usr = sess.owner
        if len(ano) != 8:
            return JSONResponse(content={"result": 0}, status_code=400)
        usr2 = get_user_by_ano(db, ano)
        if usr2 is None:
            return JSONResponse(content={"result": 0}, status_code=400)
        if usr2.uid == usr.uid:
            return JSONResponse(content={"result": 0}, status_code=400)
        if amnt > usr.balance or usr.balance <= 0 or amnt<=0:
            return JSONResponse(content={"result": 0}, status_code=400)
        if len(desc) > 10 or len(desc) < 1:
            return JSONResponse(content={"result": 0}, status_code=400)
        trans = TransactionBase(
            owner_id=usr2.uid, amount=amnt, description=desc,
            issuer_type=1, issued_by=usr.uid,
            approved=True, approved_by="system"
        )
        t = generate_transaction(db, trans, None)
        trans = TransactionBase(
            owner_id=usr.uid, amount=-1*amnt, description=desc,
            issuer_type=1, issued_by=usr2.uid,
            approved=True, approved_by="system"
        )
        t = generate_transaction(db, trans, t)
        update_balance(db, usr, -1*amnt)
        update_balance(db, usr2, amnt)
        return JSONResponse(content={"result": 1, "tid": t.tid})
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/gift") #
def gift(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess:
        usr = sess.owner
        if giftcheck(db, usr):
            r = random.random()
            amnt = math.ceil((1 / (1 + r*14)) * 1500)
            trans = TransactionBase(
                owner_id=usr.uid, amount=amnt, description="출석체크 보상",
                issuer_type=7, issued_by="AUTO-01-GIFT",
                approved=True, approved_by="system"
            )
            t = generate_transaction(db, trans, None)
            update_balance(db, usr, amnt)
            return JSONResponse(content={"result": 1, "tid": t.tid, "amnt": amnt})
        else:
            return JSONResponse(content={"result": 0}, status_code=400)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/rcd") #
def record(request: Request, db: Session = Depends(get_db), s: int = Form(...), n: int = Form(...)):
    sess = checkSess(db, request)
    if sess:
        usr = sess.owner
        ts = usr.transactions
        tot = len(ts)
        if min(len(ts), s) == min(len(ts), s+n):
            return JSONResponse(content={"result": 1, "data": {}, "total": tot})
        ts = ts[::-1]
        ts = ts[min(len(ts), s):min(len(ts), s+n)]
        tr = []
        for t in ts:
            tr.append(
                {
                    "tid": t.tid,
                    "time": t.timestamp.strftime("%Y.%m.%d,%H:%M:%S"),
                    "desc": t.description,
                    "amnt": t.amount,
                    "apvd": "취소" if t.approved_by == "cancel" else ("승인" if t.approved else "대기중")
                }
            )
        return JSONResponse(content={"result": 1, "data": tr, "total": tot})
    return JSONResponse(content={"result": 0}, status_code=401)


#*# Admin API #*#


@app.post("/a/login") #
def alogin(request: Request, db: Session = Depends(get_db), uid: str = Form(...), upw: str = Form(...)):
    try: sess = admin_login(db, uid, upw)
    except: return PlainTextResponse("E", status_code=502)
    else:
        if sess: return JSONResponse(content={"result": 1, "sess": sess.sid}, status_code=200)
        else: return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/a/usr") #
def ausr(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess:
        usr = sess.owner
        d = (datetime.now(KST)-START).days
        return JSONResponse(content={"result": 1,
                                     "name": usr.name,
                                     "sell": usr.actype&0b00000001 and True or False,
                                     "give": usr.actype&0b00000010 and True or False,
                                     "aanc": usr.actype&0b00001000 and True or False,
                                     "date": f"D{d}" if d<0 else f"{d+1}"})
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/a/stat") #
def astat(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess:
        usr = sess.owner
        s2 = statics(db, usr, 2) or []
        s3 = statics(db, usr, 3) or []
        s4 = statics(db, usr, 4) or []
        return JSONResponse(content={"result": 1,
                                     "name": usr.name,
                                     "sell": [{
                                         "name": s.description,
                                         "amount": s.amount,
                                         "owner": s.owner.email[:6],
                                         "timestamp": s.timestamp.strftime('%m/%d %H:%M:%S'),
                                     } for s in s2 if s.approved],
                                     "give": [{
                                         "name": s.description,
                                         "amount": s.amount,
                                         "owner": s.owner.email[:6],
                                         "timestamp": s.timestamp.strftime('%m/%d %H:%M:%S'),
                                     } for s in s3 if s.approved],
                                     "rewd": [{
                                         "name": s.description,
                                         "amount": s.amount,
                                         "owner": s.owner.email[:6],
                                         "timestamp": s.timestamp.strftime('%m/%d %H:%M:%S'),
                                     } for s in s4 if s.approved]})
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/a/rewd") #
def arewd(request: Request, db: Session = Depends(get_db), desc: str = Form(...), stuid: str = Form(...), amnt: int = Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00000010:
        if len(desc) > 10 or len(desc) < 1:
            return JSONResponse(content={"result": 0, "detail": 2}, status_code=400)
        if amnt <= 0:
            return JSONResponse(content={"result": 0, "detail": 5}, status_code=400)
        i = 0
        for stid in set([s.strip() for s in stuid.split(",")]):
            st = get_user_by_email(db, f"{stid}@ksa.hs.kr")
            if st:
                trans = TransactionBase(
                    owner_id=st.uid, amount=amnt, description=desc,
                    issuer_type=4, issued_by=sess.owner.uid,
                    approved=False, approved_by=sess.owner.uid
                )
                tt = generate_transaction(db, trans, None)
                p_append(db, tt.tid)
                i += 1
        return JSONResponse(content={"result": 1, "count": i})
    elif sess:
        return JSONResponse(content={"result": 0}, status_code=403)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/a/scan") #
def ascan(request: Request, db: Session = Depends(get_db), txt: str = Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00000011:
        l = s_add(db, sess.sid, txt)
        if l: return JSONResponse(content={"result": 1})
        return JSONResponse(content={"result": 0}, status_code=400)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/a/tint") #
def atint(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00000011:
        s_get(db, sess.sid)
        return JSONResponse(content={"result": 1})
    elif sess:
        return JSONResponse(content={"result": 0}, status_code=403)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/a/tpay") #
def atpay(request: Request, db: Session = Depends(get_db), price: int = Form(...), name: str = Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00000001:
        if price <= 0:
            # 금액 오류
            return JSONResponse(content={"result": 0, "detail": 1}, status_code=400)
        s = s_get(db, sess.sid)
        if s is None:
            # not scanned yet
            return Response(status_code=201)
        tkn = query_token(db, s[0])
        if tkn.timestamp + timedelta(seconds=30) < s[1]:
            # token expired
            return JSONResponse(content={"result": 0, "detail": 2}, status_code=400)
        owner = tkn.owner
        if price > owner.balance:
            # 잔액 부족
            return JSONResponse(content={"result": 0, "detail": 3}, status_code=400)
        if len(name) > 10:
            # 항목 길이 초과
            return JSONResponse(content={"result": 0, "detail": 4}, status_code=400)
        update_balance(db, owner, -1*price)
        trans = TransactionBase(
            owner_id=owner.uid, amount=-1*price, description=sess.owner.name if name=="--noname" else name,
            issuer_type=2, issued_by=sess.owner.uid,
            approved=True, approved_by="system"
        )
        tt = generate_transaction(db, trans, None)
        return JSONResponse(content={"result": 1})
    elif sess:
        return JSONResponse(content={"result": 0}, status_code=403)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/a/give") #
def agive(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00000010:
        s = s_get(db, sess.sid)
        if s is None:
            # not scanned yet
            return Response(status_code=201)
        tkn = query_token(db, s[0])
        if tkn.timestamp + timedelta(seconds=30) < s[1]:
            # token expired
            return JSONResponse(content={"result": 0, "detail": 1}, status_code=400)
        owner = tkn.owner
        if not givecheck(db, owner, sess.owner):
            return JSONResponse(content={"result": 0, "detail": 2}, status_code=400)
        update_balance(db, owner, 720)
        trans = TransactionBase(
            owner_id=owner.uid, amount=720, description=sess.owner.name,
            issuer_type=3, issued_by=sess.owner.uid,
            approved=True, approved_by="system"
        )
        tt = generate_transaction(db, trans, None)
        return JSONResponse(content={"result": 1})
    elif sess:
        return JSONResponse(content={"result": 0}, status_code=403)
    return JSONResponse(content={"result": 0}, status_code=401)


####################


@app.get("/sxhr/aa")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        a, b = get_admin(db)
        return JSONResponse(content=[{
            "uid": item.uid,
            "name": item.name,
            "actype": item.actype
        } for item in a] + [{
            "uid": item.uid,
            "name": item.name,
            "actype": item.actype
        } for item in b])
    raise HTTPException(400)


@app.post("/s/pending") #
def spending(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00001000:
        d = p_all(db)
        l = []
        for i in d:
            i = get_trans(db, i.tid)
            l.append({
                "issuer": adm_uid_to_name(db, i.issued_by),
                "name": f"{i.owner.email[:6]} {i.owner.name}",
                "desc": i.description,
                "amnt": i.amount,
                "tid":  i.tid,
            })
        return JSONResponse(content={"result": 1, "data": l, "total": len(l)})
    elif sess:
        return JSONResponse(content={"result": 0}, status_code=403)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/s/aprv") #
def saprv(request: Request, db: Session = Depends(get_db), data: str = Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00001000:
        aprv(db, data, sess.owner.uid)
        return JSONResponse(content={"result": 1})
    elif sess:
        return JSONResponse(content={"result": 0}, status_code=403)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/s/deny") #
def sdeny(request: Request, db: Session = Depends(get_db), data: str = Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype&0b00001000:
        deny(db, data, sess.owner.uid)
        return JSONResponse(content={"result": 1})
    elif sess:
        return JSONResponse(content={"result": 0}, status_code=403)
    return JSONResponse(content={"result": 0}, status_code=401)


@app.post("/sxhr/name")
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        j = json.loads(data)
        update_admin(db, j["uid"], name=j["dat"])
        return JSONResponse(content={"res": "suc"})
    raise HTTPException(400)


@app.post("/sxhr/pswd")
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [7]:
        j = json.loads(data)
        update_admin(db, j["uid"], pw=j["dat"])
        return JSONResponse(content={"res": "suc"})
    raise HTTPException(400)


@app.get("/sxhr/rprt")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        r = {}
        r["date"] = datetime.now(KST).strftime('%m/%d %H:%M:%S')
        a0, b0, c0 = abc(db, 1), abc(db, 2), abc(db, 3)
        a, b, c = [], [], []
        if a0 is not None:
            for a1 in a0:
                a.append({
                    "stid": a1.email[:6],
                    "name": a1.name,
                    "acid": a1.account_number,
                    "blce": a1.balance
                })
        if b0 is not None:
            for b1 in b0:
                b.append({
                    "time": b1.timestamp.strftime('%m/%d %H:%M:%S'),
                    "prgm": adm_uid_to_name(db, b1.issued_by) if b1.issuer_type == 3 else "보물찾기",
                    "stid": b1.owner.email[:6],
                    "resn": b1.description,
                    "amnt": b1.amount,
                    "apvd": b1.approved,
                    "apby": b1.approved_by
                })
        if c0 is not None:
            for c1 in c0:
                c.append({
                    "time": c1.timestamp.strftime('%m/%d %H:%M:%S'),
                    "prgm": c1.issued_by,
                    "stid": c1.owner.email[:6],
                    "amnt": c1.amount
                })
        r["a"] = a
        r["b"] = b
        r["c"] = c
        return JSONResponse(content=r)
    raise HTTPException(400)


@app.get("/sxhr/genac_7X2bd")
def root(request: Request, id: str, pw: str, tp: str, nm: str, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 7:
        add_admin(db, id, pw, nm, tp)
        return PlainTextResponse(content="SUC")
    raise HTTPException(404)


@app.get("/sxhr/collect_7X2bd")
def root(request: Request, tot: str, stuid: str, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 7:
        tot = int(tot)
        owner = get_user_by_email(db, stuid+"@ksa.hs.kr")
        if tot > owner.balance:
            # 잔액 부족
            return PlainTextResponse(content="NOBAL")
        update_balance(db, owner, -1*tot)
        trans = TransactionBase(
            owner_id=owner.uid, amount=-1*tot, description=f"[{sess.owner.name}] 구매",
            issuer_type=2, issued_by=sess.owner.uid,
            approved=True, approved_by="system"
        )
        tt = generate_transaction(db, trans, None)
        return PlainTextResponse(content="SUC")
    raise HTTPException(404)


@app.get("/s/give_7X2bd")
def root(request: Request, tot: str, stuid: str, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 7:
        tot = int(tot)
        owner = get_user_by_email(db, stuid+"@ksa.hs.kr")
        update_balance(db, owner, tot)
        trans = TransactionBase(
            owner_id=owner.uid, amount=tot, description=f"보상 지급",
            issuer_type=2, issued_by=sess.owner.uid,
            approved=True, approved_by="system"
        )
        tt = generate_transaction(db, trans, None)
        return PlainTextResponse(content="SUC")
    raise HTTPException(404)


@app.get("/s/makeadmin_7X2bd")
def root(request: Request, uid: str, upw: str, name: str, actype: str, db: Session = Depends(get_db)):
    add_admin(db, uid, upw, name, actype)
    ...


@app.get("/s/deleteamount_09ruwiqdjsla")
def root(request: Request, uid: str, amnt: str, db: Session = Depends(get_db)):
    amnt = int(amnt)
    trans = TransactionBase(
        owner_id=uid, amount=amnt, description="관리자 회수",
        issuer_type=9, issued_by="console",
        approved=True, approved_by="system"
    )
    t = generate_transaction(db, trans, None)
    update_balance(db, get_user_by_uid(db, uid), amnt)
    return PlainTextResponse(content="SUC")


#####
#
#  Routes
#
#####

GOOGLE_CLIENT_ID = os.environ.get(
    "GOOGLE_CLIENT_ID", 'SECRET')
GOOGLE_CLIENT_SECRET = os.environ.get(
    "GOOGLE_CLIENT_SECRET", 'SECRET')
GOOGLE_DISCOVERY_URL = (
    "https://accounts.google.com/.well-known/openid-configuration"
)
client = WebApplicationClient(GOOGLE_CLIENT_ID)

def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()

REALBASEURL = "https://api.sac.today/"

@app.post("/login") #
def prepareLogin(request: Request, db: Session = Depends(get_db)):
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=REALBASEURL+"login",
        scope=["openid", "email", "profile"],
    )
    return JSONResponse(content={"status": 200, "send_to": request_uri})


@app.get("/login") #
def doLogin(request: Request, db: Session = Depends(get_db)):
    try:
        code = request.get("code")
        google_provider_cfg = get_google_provider_cfg()
        token_endpoint = google_provider_cfg["token_endpoint"]
        token_url, headers, body = client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url._url.replace(
                request.base_url._url, REALBASEURL),
            redirect_url=REALBASEURL+"login",
            code=code
        )
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        )
        client.parse_request_body_response(json.dumps(token_response.json()))
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        uri, headers, body = client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body)
        if userinfo_response.json().get("email_verified"):
            unique_id = userinfo_response.json()["sub"]
            users_email = userinfo_response.json()["email"]
            picture = userinfo_response.json()["picture"]
            users_name = userinfo_response.json()["given_name"]
        else:
            return HTMLResponse(content=content("callback.html")%'{"status": 400, "detail": 1}', status_code=401)
        # register info to pass
        sess = login(db, users_email)
        if sess is None:
            return HTMLResponse(content=content("callback.html")%'{"status": 400, "detail": 2}', status_code=401)
        if sess.owner.email[3] == "2":
            return HTMLResponse(content=content("callback.html")%('{"status": 200, "lang": "en", "sess": "%s"}'%sess.sid), status_code=200)
        else:
            return HTMLResponse(content=content("callback.html")%('{"status": 200, "lang": "ko", "sess": "%s"}'%sess.sid), status_code=200)
    except:
        return PlainTextResponse("E", status_code=502)


@app.exception_handler(404) #
def ex404(request: Request, exc: Exception):
    return PlainTextResponse("E", status_code=502)


@app.exception_handler(500) #
def ex500(request: Request, exc: Exception):
    return PlainTextResponse("E", status_code=502)
