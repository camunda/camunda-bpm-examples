declare namespace ns = "http://my.namespace/v1";
declare variable $names external;
declare variable $skills external;

let $namesDoc := fn:parse-xml($names)
let $skillsDoc := fn:parse-xml($skills)

return
<persons xmlns='http://my.namespace/v1'>
	{
	for $id in $namesDoc/names/person/id
	return 
		<person>
			<id>{$id/text()}</id>
			{$id/following-sibling::*}
			{$skillsDoc/skills/person[id = $id]/id/following-sibling::*}
		</person>
	}
</persons>
