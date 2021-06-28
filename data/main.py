import math

import pandas as pd
import json
import csv

def asibsding():
    data = {}

    with open("archive/caracteristics.csv", encoding="utf-16") as csvf:
        csvReader = csv.DictReader(csvf)
        with open("full_char.json", "w") as jsonf:
            d = {}
            for row in csvReader:
                try:
                    print(row)
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
            #jsonf.write(json.dumps(d))


def processData():
    df = pd.read_csv("archive/caracteristics.csv")
    df = df.loc[df['lat'] > 1.0]
    df = df.loc[df['long'] != '0']
    df = df.loc[df['long'] != '-']
    df = df.loc[df['lat'] != "NaN"]
    df = df[['Num_Acc', 'lat', 'long', 'lum', 'atm', 'an', 'mois', 'jour', 'hrmn']]
    hr = []
    mn = []

    for i, row in df.iterrows():
        temp = str(df['lat'][i]).replace('.','')
        newitem = float(temp[:2] + "." + temp[2:])
        temp2 = str(df['lat'][i]).replace('.','')
        secondnewitem = float(temp2[:1] + "." + temp2[1:])
        hr.append(str(df['hrmn'][i])[:-2])
        mn.append(str(df['hrmn'][i])[-2:])
        df.at[i, 'lat'] = newitem
        df.at[i, 'long'] = secondnewitem
        df.at[i, 'an'] = 2000 + int(df['an'][i])
        df.at[i, 'atm'] = df['atm'][i]
    mn = [int(i) for i in mn]
    hr = [int(format(int(i),'.0f')) if i else None for i in hr]
    df['mn'] = mn
    df['hr'] = hr
    del df['hrmn']
    df.columns = ['Num_Acc', 'lat', 'long', 'lum', 'atm', 'y', 'm', 'd', 'mn', 'hr']
    df.to_json('caracteristics.json', orient='records')
# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    processData()
    #asibsding()

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
