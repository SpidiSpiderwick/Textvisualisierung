import json
import csv
import math

data = {}

with open("caracteristics.csv", encoding="ansi") as csvf:
    csvReader = csv.DictReader(csvf)
    with open("full_char.json", "w") as jsonf:
        d = {}
        for row in csvReader:
            try:
                acc = dict()
                acc["Num_Acc"] = int(row["Num_Acc"])
                
                if float(row["lat"]) <= 40 or math.isnan(float(row["lat"])):
                    raise Exception
                
                acc["long"] = float(row["long"]) / 100000
                
                acc["lat"] = float(row["lat"]) / 100000
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

