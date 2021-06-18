import json
import csv

data = {}

with open("caracteristics.csv", encoding="ansi") as csvf:
    csvReader = csv.DictReader(csvf)
    with open("full_char.json", "w") as jsonf:
        d = {}
        for row in csvReader:
            try:
                acc = dict()
                acc["Num_Acc"] = int(row["Num_Acc"])
                acc["long"] = float(row["long"][:1] + '.' + row["long"][1:])
                acc["lat"] = float(row["lat"][:2] + '.' + row["lat"][2:])
                acc["y"] = 2000 + int(row["an"])
                acc["m"] = int(row["mois"])
                acc["d"] = int(row["jour"])
                acc["hr"] = int(row["hrmn"][:-2])
                acc["mn"] = int(row["hrmn"][-2:])
                acc["lum"] = int(row["lum"])
                acc["atm"] = int(row["atm"])
                
                d[acc["Num_Acc"]] = acc
            except Exception:
                continue
        jsonf.write(json.dumps(d))
        
