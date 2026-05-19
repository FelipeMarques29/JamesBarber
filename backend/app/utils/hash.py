from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Hash:
    @staticmethod
    def gerar_hash(password: str):
        return pwd_context.hash(password)
    
    @staticmethod
    def verificar_hash(password_limpa, password_hash):
        return pwd_context.verify(password_limpa, password_hash)