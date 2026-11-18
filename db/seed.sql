-- Demo batches (same products as the demo fixtures). Safe to re-run.
INSERT OR IGNORE INTO batches (gtin, batch, serial, name, manufacturer, payload, expiry) VALUES
 ('09506000487120','PM-260814','48120007','Paracetamol 500 mg','PharmaMed Uzbekistan','(01)09506000487120(10)PM-260814(21)48120007(17)280814','2028-08-14'),
 ('09506000134352','NS20261104','10482001','Organic Oat Milk 1L','Northstar Foods LLC','(01)09506000134352(10)NS20261104(21)10482001(17)271130','2027-11-30'),
 ('09506000184721','AJ20261109','847210042','Alpine Trail Jacket','Alpine Works AG','https://id.gs1.org/01/09506000184721',NULL),
 ('09506000984716','HW261104','984716002','Citrus Hand Wash 250ml','Northstar Consumer Care','(01)09506000984716(10)HW261104(21)984716002','2028-10-31');
