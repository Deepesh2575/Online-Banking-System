import mysql.connector
from mysql.connector import errorcode

def try_connect(password):
    config = {
        'user': 'root',
        'password': password,
        'host': '127.0.0.1',
        'raise_on_warnings': True
    }
    try:
        cnx = mysql.connector.connect(**config)
        cnx.close()
        return True
    except mysql.connector.Error as err:
        return False

passwords_to_try = [
    "",
    "root",
    "password",
    "admin",
    "123456",
    "1234",
    "mysql",
    "pass",
    "toor"
]

print("Starting password diagnosis...")
found_password = None

for pwd in passwords_to_try:
    print(f"Trying password: '{pwd}' ... ", end="")
    if try_connect(pwd):
        print("SUCCESS!")
        found_password = pwd
        break
    else:
        print("Failed.")

if found_password is not None:
    print(f"\nFOUND_PASSWORD_HERE:{found_password}")
else:
    print("\nNO_PASSWORD_FOUND")
