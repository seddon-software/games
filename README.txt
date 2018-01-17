1. Create a Dynamic Web project and then convert it to a Maven project that generates a war.
2. Create a Run configuration for a Maven Build:
        Base Directory: ${workspace_loc:/project}
        Goals: install
        
3. Modify the pom.xml to indicate no web.xml:
    <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
      <modelVersion>4.0.0</modelVersion>
      <groupId>games</groupId>
      <artifactId>games</artifactId>
      <version>0.0.1-SNAPSHOT</version>
      <properties>
        <failOnMissingWebXml>false</failOnMissingWebXml>
      </properties>
      <packaging>war</packaging>
    </project>

4. Now build
5. Project should now be able to be run on      