<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="xml" indent="yes" />

  <xsl:template match="/customers">
    <users>
      <xsl:apply-templates />
    </users>
  </xsl:template>

  <xsl:template match="customer">
    <user>
      <xsl:apply-templates />
    </user>
  </xsl:template>

  <xsl:template match="firstName">
    <name>
      <xsl:apply-templates />
    </name>
  </xsl:template>

  <xsl:template match="lastName">
    <familyname>
      <xsl:apply-templates />
    </familyname>
  </xsl:template>

  <xsl:template match="dateOfBirth">
    <birthday>
      <xsl:apply-templates />
    </birthday>
  </xsl:template>

</xsl:stylesheet>