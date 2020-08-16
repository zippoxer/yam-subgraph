pools = [
    {"id": "1", "name": "YAMCOMPPool",},
    {"id": "2", "name": "YAMLENDPool",},
    {"id": "3", "name": "YAMLINKPool",},
    {"id": "4", "name": "YAMMKRPool",},
    {"id": "5", "name": "YAMSNXPool",},
    {"id": "6", "name": "YAMETHPool",},
    {"id": "7", "name": "YAMYFIPool",},
    {"id": "8", "name": "YAMAMPLPool",},
]

mappingTemplate = open("./src/pool-mapping/template.ts").read()

for pool in pools:
    open("./src/pool-mapping/" + pool["name"] + ".ts", "w").write(
        mappingTemplate.replace("TemplatePoolName", pool["name"]).replace(
            "TemplatePoolId", pool["id"]
        )
    )
