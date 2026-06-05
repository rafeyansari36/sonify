package com.sonify.backend;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class BackendApplication {

	private final Environment env;

	public BackendApplication(Environment env) {
		this.env = env;
	}

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@PostConstruct
	public void logMongoConfig() {
		String uri = env.getProperty("spring.data.mongodb.uri");
		String envUri = System.getenv("SPRING_DATA_MONGODB_URI");
		String maskedUri = uri == null ? "<null>" : maskCredentials(uri);
		String maskedEnvUri = envUri == null ? "<null>" : maskCredentials(envUri);
		System.out.println("[BOOT-DEBUG] spring.data.mongodb.uri property = " + maskedUri);
		System.out.println("[BOOT-DEBUG] SPRING_DATA_MONGODB_URI env      = " + maskedEnvUri);
	}

	private String maskCredentials(String uri) {
		return uri.replaceAll("://[^@]+@", "://****:****@");
	}
}
