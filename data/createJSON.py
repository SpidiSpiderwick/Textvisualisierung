import json
import csv
import math


if __name__ == '__main__':
    d = dict()

    with open("caracteristics.csv", encoding="ansi") as csvf:
        csvReader = csv.DictReader(csvf)
        for row in csvReader:
            try:
                if float(row["lat"]) / 100000 <= 40 or math.isnan(float(row["lat"])):
                    continue

                acc = dict()
                # acc["Num_Acc"] = int(row["Num_Acc"])
                acc["long"] = float(row["long"]) / 100000
                acc["lat"] = float(row["lat"]) / 100000
                acc["y"] = 2000 + int(row["an"])
                acc["m"] = int(row["mois"])
                acc["d"] = int(row["jour"])
                acc["hr"] = int(row["hrmn"][:-2])
                acc["mn"] = int(row["hrmn"][-2:])
                acc["lum"] = int(row["lum"])
                acc["atm"] = int(row["atm"])

                d[row["Num_Acc"]] = acc
            except ValueError:
                continue

    with open("places.csv", encoding="ansi") as csvf:
        csvReader = csv.DictReader(csvf)
        for row in csvReader:
            try:
                try:
                    d[row["Num_Acc"]]["surf"] = int(row["surf"])
                except ValueError:
                    d[row["Num_Acc"]]["surf"] = -1
            except KeyError:
                pass

    with open("users.csv", encoding="ansi") as csvf:
        csvReader = csv.DictReader(csvf)
        for row in csvReader:
            try:
                try:
                    d[row["Num_Acc"]]["cat_user"] = int(row["catu"])
                except ValueError:
                    d[row["Num_Acc"]]["cat_user"] = -1
                try:
                    d[row["Num_Acc"]]["grav"] = int(row["grav"])
                except ValueError:
                    d[row["Num_Acc"]]["grav"] = -1
                try:
                    d[row["Num_Acc"]]["sex"] = int(row["sexe"])
                except ValueError:
                    d[row["Num_Acc"]]["sex"] = -1
                try:
                    d[row["Num_Acc"]]["birth_year"] = int(row["an_nais"])
                except ValueError:
                    d[row["Num_Acc"]]["birth_year"] = -1
            except KeyError:
                pass

    with open("full_data.json", "w") as jsonf:
        jsonf.write(json.dumps(d))

