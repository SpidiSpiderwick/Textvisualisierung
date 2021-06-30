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
            # jsonf.write(json.dumps(d))


def processData():
    char = pd.read_csv("caracteristics.csv",
                       header=0,
                       # usecols=['Num_Acc', 'lat', 'long', 'lum', 'atm', 'an', 'mois', 'jour', 'hrmn'],
                       # names=['Num_Acc', 'lat', 'long', 'lum', 'atm', 'y', 'm', 'd', 'hrmn'],
                       index_col=['Num_Acc'],
                       sep=',')
    places = pd.read_csv("places.csv",
                         # usecols=['Num_Acc', 'surf'],
                         index_col='Num_Acc',
                         sep=',')

    users = pd.read_csv("users.csv",
                        header=0,
                        # usecols=['Num_Acc', 'catu', 'grav', 'sexe', 'an_nais'],
                        # names=['Num_Acc', 'cat_user', 'grav', 'sex', 'birth_year'],
                        index_col='Num_Acc',
                        sep=',')

    df = pd.concat([char, places, users], sort=False)

    df.rename(inplace=True,
              columns={'Num_Acc': 'Num_Acc', 'lat': 'lat', 'long': 'long', 'lum': 'lum', 'atm': 'atm', 'an': 'y',
                       'mois': 'm', 'jour': 'd', 'hrmn': 'hrmn', 'surf': 'surf', 'catu': 'catu', 'grav': 'grav',
                       'sexe': 'sex', 'an_nais': 'birth_year'})

    df = df.loc[df['lat'] / 100000 > 40]
    df = df.loc[df['long'] != '0']
    df = df.loc[df['long'] != '-']
    df = df.loc[df['lat'] != "NaN"]

    hr = []
    mn = []

    for i, row in df.iterrows():
        try:
            df.at[i, 'lat'] = float(df.at[i, 'lat']) / 100000
            df.at[i, 'long'] = float(df.at[i, 'long']) / 100000
            df.at[i, 'an'] = 2000 + int(df['y'][i])
            df.at[i, 'atm'] = int(df['atm'][i])
            hr.append(int(str(df['hrmn'][i])[:-2]))
            mn.append(int(str(df['hrmn'][i])[-2:]))
        except ValueError:
            df.drop(i)
    df['mn'] = mn
    df['hr'] = hr
    del df['hrmn']

    df.to_json('joined_categories.json', orient='index')
    # Press the green button in the gutter to run the script.


if __name__ == '__main__':
    processData()
    # asibsding()

    # See PyCharm help at https://www.jetbrains.com/help/pycharm/
